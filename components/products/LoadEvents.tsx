"use client";

import { Fragment, useState } from "react";
import EventCard from "./EventCard";
import { EventData } from "@/database/event.model";
import axios from "axios";
import { useInfiniteQuery } from "@tanstack/react-query";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
	throw new Error(
		`NEXT_PUBLIC_BASE_URL is not found and its value is: ${BASE_URL}`
	);
}

// Define a function that fetches a "page" of events
async function fetchEventsPage(params: { pageParam?: number }) {
	const skip = params.pageParam ?? 0;
	const limit = 6;

	const response = await axios.get<{ events: EventData[]; totalCount: number }>(
		`${BASE_URL}/api/events`,
		{
			params: { skip, limit },
		}
	);
	const { events, totalCount } = response.data;

	// Figure out the next skip (i.e. next pageParam)
	const fullyLoaded = skip + events.length >= totalCount;

	return {
		events,
		nextSkip: fullyLoaded ? null : skip + events.length,
	};
}

const LoadEvents = ({ initialSkip }: { initialSkip: number }) => {
	const [firstLoad, setFirstLoad] = useState(false);
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		status,
		error,
	} = useInfiniteQuery({
		queryKey: ["events", initialSkip],
		// queryFn takes a pageParam which we use to request correct "skip"
		queryFn: fetchEventsPage,
		// / start from initialSkip (e.g. from server-rendered initial events)
		initialPageParam: initialSkip,
		getNextPageParam: (lastPage) => {
			return lastPage.nextSkip;
		},
		staleTime: 1000 * 60, // 1 minute
		enabled: false, //  disables automatic first fetch
	});
	if (status === "error") {
		return <p>Error loading events: {(error as Error).message}</p>;
	}

	// console.log({ ...data }, status);
	return (
		<>
			<ul className="list-none">
				{data?.pages.map((page, index) => (
					<Fragment key={index}>
						{page.events.map((event) => (
							<li key={event._id}>
								<EventCard {...event} />
							</li>
						))}
					</Fragment>
				))}
			</ul>

			<button
				onClick={() => {
					if (!firstLoad) setFirstLoad(true); // trigger first fetch
					fetchNextPage();
				}}
				className="load-more flex justify-center items-center gap-2 px-4 py-2 border rounded-md  hover:bg-gray-800 disabled:opacity-50"
				disabled={isFetchingNextPage || (firstLoad && !hasNextPage)}
			>
				{isFetchingNextPage && (
					<span className="w-4 h-4 border-2 border-t-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span>
				)}
				{isFetchingNextPage
					? "Loading..."
					: firstLoad && !hasNextPage
					? "No More Events"
					: "Show Events"}
			</button>
		</>
	);
};

export default LoadEvents;
