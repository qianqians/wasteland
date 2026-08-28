/****************************************************************************
Copyright (c) 2015-2016 Chukong Technologies Inc.
Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

http://www.cocos2d-x.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/
package com.cocos.game;

import android.os.Bundle;
import android.content.Intent;
import android.content.res.Configuration;
import android.util.Log;

import com.cocos.service.SDKWrapper;
import com.cocos.lib.CocosActivity;
import com.cocos.lib.CocosHelper;
import com.cocos.lib.CocosJavascriptJavaBridge;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.games.GamesSignInClient;

public class AppActivity extends CocosActivity {
    private static final String TAG = "GooglePlayAuth";
    private static AppActivity sInstance = null;
    private static final String WEB_CLIENT_ID = "89726211606-14i9eofkndg6bmkm5s0jud47lv4r862c.apps.googleusercontent.com";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // DO OTHER INITIALIZATION BELOW
        SDKWrapper.shared().init(this);

        sInstance = this;
        PlayGamesSdk.initialize(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        SDKWrapper.shared().onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        SDKWrapper.shared().onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Workaround in https://stackoverflow.com/questions/16283079/re-launch-of-activity-on-home-button-but-only-the-first-time/16447508
        if (!isTaskRoot()) {
            return;
        }
        SDKWrapper.shared().onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        SDKWrapper.shared().onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        SDKWrapper.shared().onNewIntent(intent);
    }

    @Override
    protected void onRestart() {
        super.onRestart();
        SDKWrapper.shared().onRestart();
    }

    @Override
    protected void onStop() {
        super.onStop();
        SDKWrapper.shared().onStop();
    }

    @Override
    public void onBackPressed() {
        SDKWrapper.shared().onBackPressed();
        super.onBackPressed();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        SDKWrapper.shared().onConfigurationChanged(newConfig);
        super.onConfigurationChanged(newConfig);
    }

    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        SDKWrapper.shared().onRestoreInstanceState(savedInstanceState);
        super.onRestoreInstanceState(savedInstanceState);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        SDKWrapper.shared().onSaveInstanceState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onStart() {
        SDKWrapper.shared().onStart();
        super.onStart();
    }

    @Override
    public void onLowMemory() {
        SDKWrapper.shared().onLowMemory();
        super.onLowMemory();
    }

    /**
     * 供 TypeScript 调用的静态方法
     */
    public static void requestServerSideAccess() {
        if (sInstance == null) {
            Log.e(TAG, "AppActivity instance is null");
            return;
        }

        sInstance.runOnUiThread(() -> {
            GamesSignInClient gamesSignInClient = PlayGames.getGamesSignInClient(sInstance);

            gamesSignInClient.isAuthenticated().addOnCompleteListener(authTask -> {
                boolean isAuthenticated = authTask.isSuccessful() && 
                                          authTask.getResult() != null && 
                                          authTask.getResult().isAuthenticated();

                if (isAuthenticated) {
                    fetchAuthCode(gamesSignInClient);
                } else {
                    gamesSignInClient.signIn().addOnCompleteListener(signInTask -> {
                        if (signInTask.isSuccessful() && 
                            signInTask.getResult() != null && 
                            signInTask.getResult().isAuthenticated()) {
                            fetchAuthCode(gamesSignInClient);
                        } else {
                            notifyTSCallback(false, "Play Games sign in failed");
                        }
                    });
                }
            });
        });
    }

    private static void fetchAuthCode(GamesSignInClient gamesSignInClient) {
        gamesSignInClient.requestServerSideAccess(WEB_CLIENT_ID, false)
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    String serverAuthCode = task.getResult();
                    Log.d(TAG, "Server Auth Code acquired successfully: " + serverAuthCode);
                    notifyTSCallback(true, serverAuthCode);
                } else {
                    Exception e = task.getException();
                    String errorMsg = (e != null) ? e.getMessage() : "Unknown error";
                    Log.e(TAG, "Failed to get Server Auth Code: " + errorMsg);
                    notifyTSCallback(false, errorMsg);
                }
            });
    }

    private static void notifyTSCallback(boolean success, String resultData) {
        CocosHelper.runOnGameThread(() -> {
            String jsCode = String.format(
                "window.onGooglePlayAuthResult && window.onGooglePlayAuthResult(%b, '%s');",
                success,
                resultData
            );
            CocosJavascriptJavaBridge.evalString(jsCode);
        });
    }
}
