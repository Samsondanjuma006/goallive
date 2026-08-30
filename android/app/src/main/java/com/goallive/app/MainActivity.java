package com.goallive.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private static final String START_URL =
            "https://goallivecom.netlify.app/";

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        webView.setWebViewClient(new WebViewClient() {

            @Override
            public boolean shouldOverrideUrlLoading(
                    WebView view,
                    WebResourceRequest request) {

                Uri uri = request.getUrl();

                if ("https".equalsIgnoreCase(uri.getScheme())
                        && uri.getHost() != null
                        && uri.getHost().equals("goallivecom.netlify.app")) {

                    return false;
                }

                try {
                    Intent intent = new Intent(
                            Intent.ACTION_VIEW,
                            uri
                    );

                    startActivity(intent);
                } catch (Exception ignored) {
                }

                return true;
            }

            @Override
            public void onPageStarted(
                    WebView view,
                    String url,
                    Bitmap favicon) {

                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error) {

                if (request.isForMainFrame()) {
                    Toast.makeText(
                            MainActivity.this,
                            "Unable to load GoalLive. Check your internet connection.",
                            Toast.LENGTH_LONG
                    ).show();
                }

                super.onReceivedError(view, request, error);
            }
        });

        webView.loadUrl(START_URL);

        getOnBackPressedDispatcher().addCallback(
                this,
                new OnBackPressedCallback(true) {

                    @Override
                    public void handleOnBackPressed() {

                        if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            finish();
                        }
                    }
                }
        );
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onPause() {

        if (webView != null) {
            webView.onPause();
        }

        super.onPause();
    }

    @Override
    protected void onDestroy() {

        if (webView != null) {
            webView.destroy();
            webView = null;
        }

        super.onDestroy();
    }
}
