if [ $TRAVIS_PULL_REQUEST = "false" ]; then
    # we need to clone the repo once again, as by default Travis CI makes
    # shallow clones where gh-pages branch is not available and can't be fetched
    git clone "https://github.com/${TRAVIS_REPO_SLUG}.git" temp && cd temp &&
    git config user.email "releasebot@ariatemplates.com" &&
    git config user.name "Release Bot" &&
    git checkout -b gh-pages origin/gh-pages &&
    cp -rf ../dist dist &&
    git add -f dist &&
    git commit -m "release ${TRAVIS_COMMIT}" &&
    git push "https://${GH_CREDENTIALS}@github.com/${TRAVIS_REPO_SLUG}.git" gh-pages
fi