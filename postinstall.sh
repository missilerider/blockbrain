#/bin/sh

if [ -e blockly ]
then
    cd blockly
    git pull
    cd ../closure-library
    git pull
    cd ..
else
    git clone git@github.com:google/blockly.git blockly
    git clone git@github.com:google/closure-library.git closure-library
fi
