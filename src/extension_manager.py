import os, sys, json, importlib.util, importlib

from pathlib import Path

try:
    import requests
except ImportError:
    import urllib.request as _urllib
    requests = None

EXTENSIONS_DIR = Path(__file__).parent / "extensions"
EXTENSIONS_DIR.mkdir(exist_ok=True)
INSTALLED_FILE = EXTENSIONS_DIR / ".installed.json"
INDEX_URL = "https://raw.githubusercontent.com/Reennaan/plugins/refs/heads/master/main/extensions_index.json"


def _http_get(url: str, timeout: int = 10) -> str:
    import urllib.request
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8")

def _load_installed():
    if INSTALLED_FILE.exists():
        try:
            return json.loads(INSTALLED_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}

def _save_installed(data):
    INSTALLED_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

def fetch_available_extensions():
    try:
        return json.loads(_http_get(INDEX_URL))
    except Exception as exc:
        print(f"[ExtensionManager] index not avaliable: {exc}")
        return []

def get_installed_extensions():
    return _load_installed()

def install_extension(ext):
    ext_id = ext.get("id", "")
    file_url = ext.get("file_url", "")
    if not ext_id or not file_url:
        return False, "extension without 'id' or 'file_url'."
    dest = EXTENSIONS_DIR / f"{ext_id}.py"
    try:
        code = _http_get(file_url)
    except Exception as exc:
        return False, f"failed to download: {exc}"
    try:
        dest.write_text(code, encoding="utf-8")
    except Exception as exc:
        return False, f"Falha ao salvar arquivo: {exc}"
    installed = _load_installed()
    installed[ext_id] = {"id": ext_id, "name": ext.get("name", ext_id),
                         "version": ext.get("version", "?"),
                         "description": ext.get("description", ""),
                         "file": str(dest)}
    _save_installed(installed)
    _reload_module(ext_id)
    return True, f"'{ext.get('name', ext_id)}' successfully installed"

def uninstall_extension(ext_id):
    dest = EXTENSIONS_DIR / f"{ext_id}.py"
    _unload_module(ext_id)
    if dest.exists():
        try:
            dest.unlink()
        except Exception as exc:
            return False, f"was not possible delete the files: {exc}"
    installed = _load_installed()
    name = installed.pop(ext_id, {}).get("name", ext_id)
    _save_installed(installed)
    return True, f"'{name}' uninstalled"

def load_all_providers():
    try:
        from plugins.base import BaseProvider
    except ImportError:
        BaseProvider = object
    providers = []
    for ext_id in _load_installed():
        inst = _load_provider_instance(ext_id, BaseProvider)
        if inst:
            providers.append(inst)
    return providers

def get_provider_by_id(ext_id):
    try:
        from plugins.base import BaseProvider
    except ImportError:
        BaseProvider = object
    return _load_provider_instance(ext_id, BaseProvider)

def _module_name(ext_id):
    return f"_mango_ext_{ext_id}"

def _load_provider_instance(ext_id, base_class):
    py_file = EXTENSIONS_DIR / f"{ext_id}.py"
    if not py_file.exists():
        return None
    mod_name = _module_name(ext_id)
    try:
        spec = importlib.util.spec_from_file_location(mod_name, py_file)
        module = importlib.util.module_from_spec(spec)
        sys.modules[mod_name] = module
        spec.loader.exec_module(module)
    except Exception as exc:
        print(f"[ExtensionManager] failed to load  '{ext_id}': {exc}")
        return None
    for attr_name in dir(module):
        obj = getattr(module, attr_name)
        try:
            if isinstance(obj, type) and issubclass(obj, base_class) and obj is not base_class:
                return obj()
        except TypeError:
            pass
    return None

def _reload_module(ext_id):
    mod_name = _module_name(ext_id)
    if mod_name in sys.modules:
        try:
            importlib.reload(sys.modules[mod_name])
        except Exception:
            pass

def _unload_module(ext_id):
    sys.modules.pop(_module_name(ext_id), None)