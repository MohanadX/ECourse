"use client";

import Youtube from "react-youtube";

export default function YoutubeVideoPlayer({
	videoId,
	onFinishedVideo,
}: {
	videoId: string;
	onFinishedVideo?: () => void;
}) {
	return (
		<Youtube
			videoId={videoId}
			className="h-full aspect-video"
			opts={{ width: "100%", height: "100%" }}
			onEnd={onFinishedVideo}
		/>
	);
}
