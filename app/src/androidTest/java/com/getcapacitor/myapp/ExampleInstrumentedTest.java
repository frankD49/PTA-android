package com.getcapacitor.myapp;

import static org.junit.Assert.*;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.Arrays;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Test
    public void useAppContext() throws Exception {
        // Context of the app under test.
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("com.precioustotsacademy.pta", appContext.getPackageName());
    }

    @Test
    public void releaseDoesNotRequestBroadMediaPermissions() throws Exception {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        PackageInfo info = appContext.getPackageManager().getPackageInfo(appContext.getPackageName(), PackageManager.GET_PERMISSIONS);
        String[] permissions = info.requestedPermissions == null ? new String[0] : info.requestedPermissions;
        assertFalse(Arrays.asList(permissions).contains("android.permission.READ_MEDIA_IMAGES"));
        assertFalse(Arrays.asList(permissions).contains("android.permission.READ_MEDIA_VIDEO"));
        assertFalse(Arrays.asList(permissions).contains("android.permission.READ_EXTERNAL_STORAGE"));
        assertFalse(Arrays.asList(permissions).contains("android.permission.WRITE_EXTERNAL_STORAGE"));
    }
}
