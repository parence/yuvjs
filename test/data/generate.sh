#!/bin/bash

getDims () {
    meta=`ffprobe -v error -select_streams v -show_entries stream=width,height -of json $mp4`
    width=`echo $meta | jq .streams[0].width`
    height=`echo $meta | jq .streams[0].height`
}

transform () {
    name=$1
    frames=$2
    width=$3
    bits=$4
    fmt=$5
    echo $name
    echo $frames
    echo $width
    echo $bits
    echo $mp4

    pix_fmt="yuv${fmt}"
    if [ $bits -eq 10 ]
    then
        pix_fmt="${pix_fmt}p10"
    else
        pix_fmt="${pix_fmt}p"
    fi
    mp4="${name}.mp4"
    trans_name="${name}_${fmt}_${frames}"
    trans_mp4="${trans_name}.mp4"

    ffmpeg -i $mp4 -frames:v $frames -vf scale=$width:-1 -c:v libx265 ${trans_mp4} -y
    height=`ffprobe -v error -select_streams v -show_entries stream=width,height -of json ${trans_mp4} | jq .streams[0].height`
    trans_name="${trans_name}_${width}x${height}_${bits}"
    ffmpeg -i ${trans_mp4} -pix_fmt ${pix_fmt} "${trans_name}.yuv" -y
}


link='pexels.com/video/2863422/download'
name='fish'
mp4="${name}.mp4"
wget $link --output-document $mp4

transform $name 40 280 8 "444"
transform $name 25 320 10 "420"

# TODO how to generate yuv 400 with ffmpeg?
# transform $name 40 320 10 "400"


link='https://pexels.com/video/8708800/download/'
name='winter'
mp4="${name}.mp4"
wget $link --output-document $mp4

transform $name 20 260 10 "444"
transform $name 10 220 8 "420"
