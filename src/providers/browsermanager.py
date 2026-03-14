
from playwright.sync_api import sync_playwright

class BrowserManager:

    browser = None

    @classmethod
    def get_browser(cls):
        if cls.browser is None:
            cls.playwright = sync_playwright().start()
            cls.browser = cls.playwright.chromium.launch(headless=True)
        return cls.browser