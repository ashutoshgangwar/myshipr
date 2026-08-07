# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Keep React Native related classes used by reflection/codegen
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keepclassmembers class * {
	@com.facebook.proguard.annotations.DoNotStrip *;
}

# Keep Google Maps models used via JNI
-keep class com.google.android.gms.maps.** { *; }

# HERE SDK Navigate — the whole SDK is a JNI bridge: the native layer resolves
# Java classes, fields and listener callbacks by name, so R8 must not rename or
# strip any of it (this includes the public data classes we serialise to JS).
-keep class com.here.** { *; }
-keep interface com.here.** { *; }
-keepclassmembers class com.here.** { *; }
-dontwarn com.here.**

# androidx.car is an optional HERE dependency (LocationEngine vehicle sensors)
# that we don't ship.
-dontwarn androidx.car.app.**

# The Radar SDK has an OPTIONAL Firebase Cloud Messaging integration
# (RadarFirebaseMessagingService). We don't ship firebase-messaging, so R8 can't
# resolve these classes during minification. We don't use FCM, so silence them.
-dontwarn com.google.firebase.messaging.FirebaseMessaging
-dontwarn com.google.firebase.messaging.FirebaseMessagingService
