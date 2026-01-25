"use client";

import Youtube from "react-youtube";

export default function YoutubeVideoPlayer({
	videoId,
	onFinishedVideoAction,
}: {
	videoId: string;
	onFinishedVideoAction?: () => void;
}) {
	return (
		<Youtube
			videoId={videoId}
			className="h-full aspect-video"
			opts={{ width: "100%", height: "100%" }}
			onEnd={onFinishedVideoAction}
		/>
	);
}
