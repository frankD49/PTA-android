package com.precioustotsacademy.pta;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Ensure bundled UI updates are not hidden by an older WebView cache.
        getBridge().getWebView().clearCache(true);
    }
}
