#!/bin/bash
set -e

source $HOME/.bashrc

echo "Android Build started for Live Stream"

ls -la

sed -i -e 's/5.0.8/16.0.1/g' ./template/package.json
 
npm cache clear -force
#nvm use 17.7.2
node --version
npm run dev-setup
cd template
npm run android:build

ls -la
# rm -rf /Users/manoj/Work/apkRelease/*.apk
 
# cp -R /Users/manoj/.jenkins/workspace/LiveStream_Android/template/android/app/build/outputs/apk/release/app-release.apk /Users/manoj/Work/apkRelease
 
 
# cd /Users/manoj/Work/apkRelease
# mv app-release.apk "${JOB_NAME}_${BUILD_NUMBER}.apk"
# aws s3 cp --recursive ${JOB_NAME}_${BUILD_NUMBER}.apk  s3://agora-app-builder-qa-android-build-artifacts
 
echo "Build android completed"