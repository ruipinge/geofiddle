#!/bin/bash
# Publishes (or deploys) GeoFiddle site to GitHub Pages using gh-pages branch.

# Makes script exit when subsequent commands fail
set -e

export PUBLISH_BRANCH=gh-pages
export BUILD_ID="$(date +%s)"
export SRC_DIR="./www"
export DST_DIR="./"

pushd "$(dirname "$0")"/..

# Reset and checkout GitHub Pages branch
git branch -C $PUBLISH_BRANCH
git checkout $PUBLISH_BRANCH

# Copy relevant (static) files
cp $SRC_DIR/*.* $DST_DIR
cp -r $SRC_DIR/css $DST_DIR

# Generate main.min.js JavaScript minified file
./nvmw npm run build

# Remove development JavaScript file reference
sed -i '' -e 's/^.*JS Development version.*$//' $DST_DIR/index.html

# Uncomment production/minified JavaScript file reference
sed -i '' -e 's/^.*JS Production version \(.*\) -->.*$/  \1/' $DST_DIR/index.html

# Deploy by adding and pushing
git add $DST_DIR
git commit -m"Build $BUILD_ID publish."
git push -f origin $PUBLISH_BRANCH

git tag -a $BUILD_ID master -m"Build $BUILD_ID"

popd
