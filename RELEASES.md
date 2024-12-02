# Releases

## Android - (internal testers)

Android builds can be manually released by running the `Release - Production` workflow, downloading the bundle from github, and uploading the bundle to the playstore.

1. Run the [Release - Production Action](https://github.com/mobilestack-xyz/mobilestack-mento/actions/workflows/release-production.yml) against the `main` branch
1. Download and unzip the android bundle generated. You can find the url in the build logs under android => fastlane-android (mainnet) => Upload Android build artifacts. [Here is an example](https://github.com/mobilestack-xyz/mobilestack-mento/actions/runs/11967777145/job/33365530323#step:16:51)
1. Create a new release for internal test users. Navigate to [Internal Testing](https://play.google.com/console/u/0/developers/5695387721434163201/app/4974536396935190989/tracks/internal-testing) and click `Create new release`. Upload the app bundle that you just dowloaded and unzipped and click `Next`. Click `Save and Publish` on the next screen.
1. You're done! Internal testers should be able to download the latest version of Mento on their android devices.
