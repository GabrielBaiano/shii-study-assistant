#include <node_api.h>
#include <assert.h>
#include <windows.h>

// Função para definir DisplayAffinity de uma janela
napi_value SetWindowDisplayAffinity(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_status status;
    
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    assert(status == napi_ok);
    
    if (argc < 1) {
        napi_throw_error(env, NULL, "Esperado handle da janela (HWND) como número");
        return NULL;
    }
    
    int64_t hwnd_value;
    bool lossless; // Variável necessária para a função de BigInt
    
    // ----- LINHA CORRIGIDA ABAIXO -----
    status = napi_get_value_bigint_int64(env, args[0], &hwnd_value, &lossless);
    assert(status == napi_ok);
    
    HWND hwnd = reinterpret_cast<HWND>(hwnd_value);
    DWORD affinity = 0x00000011;  // WDA_EXCLUDEFROMCAPTURE
    
    BOOL result = ::SetWindowDisplayAffinity(hwnd, affinity);
    
    napi_value js_result;
    status = napi_get_boolean(env, result != 0, &js_result);
    assert(status == napi_ok);
    
    return js_result;
}

// Função para obter handle da janela por título (NÃO PRECISA MUDAR)
napi_value GetWindowByTitle(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_status status;
    
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    assert(status == napi_ok);
    
    if (argc < 1) {
        napi_throw_error(env, NULL, "Esperado título da janela como string");
        return NULL;
    }
    
    size_t str_size;
    status = napi_get_value_string_utf8(env, args[0], NULL, 0, &str_size);
    assert(status == napi_ok);
    
    char* title = new char[str_size + 1];
    status = napi_get_value_string_utf8(env, args[0], title, str_size + 1, &str_size);
    assert(status == napi_ok);
    
    HWND hwnd = FindWindowA(NULL, title);
    delete[] title;
    
    napi_value js_result;
    if (hwnd == NULL) {
        status = napi_get_null(env, &js_result);
    } else {
        // Retornar como BigInt é mais seguro para handles de 64-bit
        status = napi_create_bigint_int64(env, reinterpret_cast<int64_t>(hwnd), &js_result);
    }
    assert(status == napi_ok);
    
    return js_result;
}

// Função para remover DisplayAffinity
napi_value RemoveWindowDisplayAffinity(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_status status;
    
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    assert(status == napi_ok);
    
    if (argc < 1) {
        napi_throw_error(env, NULL, "Esperado handle da janela (HWND) como número");
        return NULL;
    }
    
    int64_t hwnd_value;
    bool lossless; // Variável necessária para a função de BigInt

    // ----- LINHA CORRIGIDA ABAIXO -----
    status = napi_get_value_bigint_int64(env, args[0], &hwnd_value, &lossless);
    assert(status == napi_ok);
    
    HWND hwnd = reinterpret_cast<HWND>(hwnd_value);
    
    BOOL result = ::SetWindowDisplayAffinity(hwnd, 0x00000000);  // WDA_NONE
    
    napi_value js_result;
    status = napi_get_boolean(env, result != 0, &js_result);
    assert(status == napi_ok);
    
    return js_result;
}

// Inicialização do módulo (NÃO PRECISA MUDAR)
napi_value Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_property_descriptor properties[] = {
      { "setWindowDisplayAffinity", 0, SetWindowDisplayAffinity, 0, 0, 0, napi_default, 0 },
      { "getWindowByTitle", 0, GetWindowByTitle, 0, 0, 0, napi_default, 0 },
      { "removeWindowDisplayAffinity", 0, RemoveWindowDisplayAffinity, 0, 0, 0, napi_default, 0 }
    };
    status = napi_define_properties(env, exports, sizeof(properties) / sizeof(properties[0]), properties);
    assert(status == napi_ok);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)

