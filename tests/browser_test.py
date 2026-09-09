"""Browser regression checks against Vite preview, or an offline source rendering.

Default: npm run build && npm run preview -- --host 127.0.0.1
Then: python -m unittest discover -s tests -p browser_test.py -v
Offline: PACKGAUGE_SOURCE_PREVIEW=1 (does NOT validate a Vite production build).
Set BROWSER_EXECUTABLE to use an installed Chromium instead of Playwright's.
"""
import os
from pathlib import Path
import re
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('PACKGAUGE_BASE_URL', 'http://127.0.0.1:4173').rstrip('/')
SOURCE = os.environ.get('PACKGAUGE_SOURCE_PREVIEW') == '1'

class WebsiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        options = {'args': ['--no-sandbox']}
        if executable := os.environ.get('BROWSER_EXECUTABLE'):
            options['executable_path'] = executable
        cls.browser = cls.pw.chromium.launch(**options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])

    def load(self, name='index.html', page=None, javascript=True):
        page = page or self.page
        if SOURCE:
            # Render reviewed source entirely in memory. No external requests.
            html = (ROOT / name).read_text(encoding='utf-8')
            html = html.replace('<link rel="stylesheet" href="./src/styles.css" />', '<style>' + (ROOT/'src/styles.css').read_text(encoding='utf-8') + '</style>')
            html = re.sub(r'<script type="module" src="\./src/main.js"></script>', '', html)
            page.set_content(html, wait_until='load')
            if javascript:
                data = (ROOT/'src/sample-data.js').read_text(encoding='utf-8').replace('export ', '')
                main = re.sub(r'^import .*?;\n', '', (ROOT/'src/main.js').read_text(encoding='utf-8'), count=1)
                page.add_script_tag(content=data + '\n' + main, type='module')
        else:
            page.goto(BASE + '/' + name, wait_until='networkidle')
        if javascript:
            expect(page.locator('html')).to_have_class('js')
        return page

    def test_layouts_across_three_pages_and_ten_widths(self):
        for name in ['index.html', 'compatibility.html', 'safety.html']:
            for width in [320, 375, 390, 700, 768, 900, 901, 1024, 1440, 1920]:
                with self.subTest(page=name, width=width):
                    self.page.set_viewport_size({'width': width, 'height': 1000})
                    self.load(name)
                    self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))
                    expect(self.page.locator('h1')).to_have_count(1)
                    expect(self.page.locator('main')).to_be_visible()

    def test_tabs_mouse_and_keyboard(self):
        self.load()
        tabs = self.page.get_by_role('tab')
        for i, name in enumerate(['pack', 'charge', 'use', 'load', 'conditions']):
            tabs.nth(i).click()
            expect(self.page.locator(f'#panel-{name}')).to_be_visible()
            expect(self.page.locator('[role="tab"][aria-selected="true"]')).to_have_count(1)
            expect(self.page.locator('[role="tabpanel"]:visible')).to_have_count(1)
        tabs.nth(4).press('ArrowRight')
        expect(tabs.nth(0)).to_be_focused()
        tabs.nth(0).press('ArrowLeft')
        expect(tabs.nth(4)).to_be_focused()
        tabs.nth(4).press('Home')
        expect(tabs.nth(0)).to_be_focused()
        tabs.nth(0).press('End')
        expect(tabs.nth(4)).to_be_focused()

    def test_profiles_restore_missing_history_without_zero(self):
        self.load()
        self.page.locator('#sample-profile').select_option('limited')
        expect(self.page.locator('[data-value="spread"]')).to_have_text('4')
        expect(self.page.locator('[data-value="faults"]')).to_have_text('Unavailable')
        expect(self.page.locator('[data-value="charges"]')).to_have_text('42')
        self.page.locator('#tab-load').click()
        expect(self.page.locator('[data-load-chart]')).to_be_hidden()
        expect(self.page.locator('[data-load-empty]')).to_be_visible()
        self.page.locator('#sample-profile').select_option('detailed')
        expect(self.page.locator('[data-load-chart]')).to_be_visible()
        expect(self.page.locator('[data-load-empty]')).to_be_hidden()
        expect(self.page.locator('[data-value="faults"]')).to_have_text('2')

    def test_all_profile_and_tab_combinations_at_320_pixels(self):
        self.page.set_viewport_size({'width': 320, 'height': 850})
        self.load()
        for profile in ['limited', 'detailed']:
            self.page.locator('#sample-profile').select_option(profile)
            for tab in self.page.get_by_role('tab').all():
                tab.click()
                self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))
                expect(self.page.locator('[role="tabpanel"]:visible')).to_have_count(1)

    def test_csv_download_is_real_and_labels_missing_fields(self):
        self.load()
        self.page.locator('#sample-profile').select_option('limited')
        with self.page.expect_download() as download_info:
            self.page.locator('[data-download]').click()
        download = download_info.value
        self.assertEqual(download.suggested_filename, 'packgauge-illustrative-limited.csv')
        self.assertIsNone(download.failure())
        text = Path(download.path()).read_text(encoding='utf-8-sig')
        self.assertIn('ILLUSTRATIVE WEB DEMO — NOT A REAL SCAN', text)
        self.assertIn('"fault_events","","","unavailable"', text)
        expect(self.page.locator('[data-demo-status]')).to_contain_text('download requested')

    def test_mobile_menu_escape_outside_click_and_resize(self):
        self.page.set_viewport_size({'width': 390, 'height': 844})
        self.load()
        toggle = self.page.locator('.nav-toggle')
        nav = self.page.locator('#site-nav')
        expect(nav).to_be_hidden()
        toggle.click()
        expect(nav).to_be_visible()
        toggle.press('Escape')
        expect(nav).to_be_hidden()
        expect(toggle).to_be_focused()
        toggle.click()
        self.page.locator('h1').click()
        expect(nav).to_be_hidden()
        toggle.click()
        self.page.set_viewport_size({'width': 1024, 'height': 1000})
        expect(toggle).to_be_hidden()
        expect(nav).to_be_visible()
        self.page.set_viewport_size({'width': 390, 'height': 844})
        expect(nav).to_be_hidden()

    def test_no_javascript_retains_navigation_and_every_sample_view(self):
        context = self.browser.new_context(java_script_enabled=False, viewport={'width': 375, 'height': 900})
        try:
            page = context.new_page()
            self.load(page=page, javascript=False)
            expect(page.locator('#site-nav')).to_be_visible()
            expect(page.locator('.nav-toggle')).to_be_hidden()
            expect(page.locator('[role="tabpanel"]:visible')).to_have_count(5)
            expect(page.locator('[data-download]')).to_be_hidden()
            self.assertFalse(page.evaluate('document.documentElement.scrollWidth > innerWidth'))
        finally:
            context.close()

    def test_reduced_motion_and_native_faq(self):
        self.page.emulate_media(reduced_motion='reduce')
        self.load()
        self.assertEqual(self.page.evaluate('getComputedStyle(document.documentElement).scrollBehavior'), 'auto')
        summary = self.page.locator('.faq summary').first
        summary.focus()
        summary.press('Enter')
        expect(self.page.locator('.faq details').first).to_have_attribute('open', '')
        summary.press('Enter')
        self.assertIsNone(self.page.locator('.faq details').first.get_attribute('open'))

if __name__ == '__main__':
    unittest.main(verbosity=2)
