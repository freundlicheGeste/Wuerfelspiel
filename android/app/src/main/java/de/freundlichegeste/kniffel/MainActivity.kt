package de.freundlichegeste.kniffel

import android.annotation.SuppressLint
import android.media.AudioManager
import android.media.ToneGenerator
import android.content.ContentValues
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import java.io.IOException

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private val soundHandler = Handler(Looper.getMainLooper())
    private var toneGenerator: ToneGenerator? = null

    private val filePickerLauncher =
        registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            val result = uri?.let { arrayOf(it) }
            fileChooserCallback?.onReceiveValue(result)
            fileChooserCallback = null
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.parseColor("#0A0A0F")
        window.navigationBarColor = Color.parseColor("#0A0A0F")

        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#0A0A0F"))
            overScrollMode = WebView.OVER_SCROLL_NEVER
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                allowContentAccess = true
                databaseEnabled = true
                builtInZoomControls = false
                displayZoomControls = false
                setSupportZoom(false)
                loadWithOverviewMode = true
                useWideViewPort = true
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
            }

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ) = assetLoader.shouldInterceptRequest(request.url)
            }

            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    fileChooserCallback?.onReceiveValue(null)
                    fileChooserCallback = filePathCallback
                    filePickerLauncher.launch(arrayOf("application/json", "text/json", "*/*"))
                    return true
                }
            }

            addJavascriptInterface(AndroidBridge(), "AndroidBridge")
        }

        setContentView(webView)

        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    webView.evaluateJavascript("window.handleAndroidBack && window.handleAndroidBack()") { result ->
                        if (result != "true") {
                            finish()
                        }
                    }
                }
            }
        )

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl("https://appassets.androidplatform.net/assets/public/index.html")
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        soundHandler.removeCallbacksAndMessages(null)
        toneGenerator?.release()
        toneGenerator = null
        super.onDestroy()
    }

    private fun toneGenerator(): ToneGenerator {
        return toneGenerator ?: ToneGenerator(AudioManager.STREAM_MUSIC, 85).also {
            toneGenerator = it
        }
    }

    private fun playToneSequence(sequence: List<Pair<Int, Int>>, gapMs: Int = 40) {
        var offsetMs = 0L
        sequence.forEach { (tone, duration) ->
            soundHandler.postDelayed({
                try {
                    toneGenerator().startTone(tone, duration)
                } catch (_: RuntimeException) {
                }
            }, offsetMs)
            offsetMs += duration + gapMs
        }
    }

    inner class AndroidBridge {
        @android.webkit.JavascriptInterface
        fun saveBackup(json: String, fileName: String): Boolean {
            return try {
                val cleanName = fileName.ifBlank { "kniffel-backup.json" }
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, cleanName)
                    put(MediaStore.Downloads.MIME_TYPE, "application/json")
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }

                val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    ?: return false

                contentResolver.openOutputStream(uri)?.use { stream ->
                    stream.write(json.toByteArray(Charsets.UTF_8))
                } ?: return false

                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Backup gespeichert: Downloads/$cleanName",
                        Toast.LENGTH_LONG
                    ).show()
                }
                true
            } catch (_: IOException) {
                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Backup konnte nicht gespeichert werden",
                        Toast.LENGTH_LONG
                    ).show()
                }
                false
            }
        }

        @android.webkit.JavascriptInterface
        fun playSound(type: String?) {
            val soundType = type?.lowercase() ?: return
            runOnUiThread {
                when (soundType) {
                    "roll" -> playToneSequence(
                        listOf(
                            ToneGenerator.TONE_CDMA_KEYPAD_VOLUME_KEY_LITE to 40,
                            ToneGenerator.TONE_CDMA_KEYPAD_VOLUME_KEY_LITE to 40,
                            ToneGenerator.TONE_CDMA_KEYPAD_VOLUME_KEY_LITE to 55
                        ),
                        gapMs = 24
                    )

                    "kniffel" -> playToneSequence(
                        listOf(
                            ToneGenerator.TONE_PROP_ACK to 90,
                            ToneGenerator.TONE_PROP_BEEP2 to 95,
                            ToneGenerator.TONE_SUP_CONFIRM to 120,
                            ToneGenerator.TONE_PROP_ACK to 140
                        ),
                        gapMs = 36
                    )

                    "gameover" -> playToneSequence(
                        listOf(
                            ToneGenerator.TONE_PROP_ACK to 110,
                            ToneGenerator.TONE_PROP_BEEP2 to 110,
                            ToneGenerator.TONE_SUP_CONFIRM to 150,
                            ToneGenerator.TONE_PROP_ACK to 180
                        ),
                        gapMs = 42
                    )
                }
            }
        }
    }
}
