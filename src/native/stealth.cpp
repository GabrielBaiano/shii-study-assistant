#include <napi.h>
#include <windows.h>

Napi::Boolean SetWindowDisplayAffinity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsBigInt()) {
        return Napi::Boolean::New(env, false);
    }
    
    bool lossless;
    int64_t hwnd_value = info[0].As<Napi::BigInt>().Int64Value(&lossless);
    
    if (!lossless) {
        return Napi::Boolean::New(env, false);
    }
    
    HWND hwnd = reinterpret_cast<HWND>(hwnd_value);
    DWORD affinity = 0x00000011;  // WDA_EXCLUDEFROMCAPTURE
    
    BOOL result = ::SetWindowDisplayAffinity(hwnd, affinity);
    return Napi::Boolean::New(env, result != 0);
}

Napi::Boolean RemoveWindowDisplayAffinity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsBigInt()) {
        return Napi::Boolean::New(env, false);
    }
    
    bool lossless;
    int64_t hwnd_value = info[0].As<Napi::BigInt>().Int64Value(&lossless);
    
    if (!lossless) {
        return Napi::Boolean::New(env, false);
    }
    
    HWND hwnd = reinterpret_cast<HWND>(hwnd_value);
    BOOL result = ::SetWindowDisplayAffinity(hwnd, 0x00000000);  // WDA_NONE
    
    return Napi::Boolean::New(env, result != 0);
}

Napi::Value GetWindowByTitle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        return env.Null();
    }
    
    std::string title = info[0].As<Napi::String>().Utf8Value();
    HWND hwnd = FindWindowA(NULL, title.c_str());
    
    if (hwnd == NULL) {
        return env.Null();
    }
    
    return Napi::BigInt::New(env, reinterpret_cast<int64_t>(hwnd));
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("setWindowDisplayAffinity", Napi::Function::New(env, SetWindowDisplayAffinity));
    exports.Set("removeWindowDisplayAffinity", Napi::Function::New(env, RemoveWindowDisplayAffinity));
    exports.Set("getWindowByTitle", Napi::Function::New(env, GetWindowByTitle));
    return exports;
}

NODE_API_MODULE(stealth, Init)