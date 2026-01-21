"use client";

import { Fragment, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchEProductsPage } from "@/features/actions/products";
import { Button } from "../ui/button";
import { ProductCardClient } from "./ProductCardClient";

const LoadProducts = ({ initialSkip }: { initialSkip: number }) => {
	const [firstLoad, setFirstLoad] = useState(false);
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		status,
		error,
	} = useInfiniteQuery({
		queryKey: ["products"],
		// queryFn takes a pageParam which we use to request correct "skip"
		queryFn: fetchEProductsPage,
		// / start from initialSkip (e.g. from server-rendered initial events)
		initialPageParam: initialSkip,
		getNextPageParam: (lastPage) => {
			return lastPage.nextSkip;
		},
		staleTime: 1000 * 60, // 1 minute
		enabled: false, //  disables automatic first fetch
	});
	if (status === "error") {
		return <p>Error loading products: {(error as Error).message}</p>;
	}

	console.log({ ...data }, status);
	return (
		<>
			<ul className="containers my-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
				{data?.pages.map((page, index) => (
					<Fragment key={index}>
						{page.products.map((product) => (
							<ProductCardClient key={product.id} {...product} />
						))}
					</Fragment>
				))}
			</ul>

			<Button
				onClick={() => {
					if (!firstLoad) setFirstLoad(true); // trigger first fetch
					fetchNextPage();
				}}
				className="my-4 mx-auto flex justify-center items-center gap-2 px-4 py-2 border rounded-md cursor-pointer"
				disabled={isFetchingNextPage || (firstLoad && !hasNextPage)}
			>
				{isFetchingNextPage && (
					<span className="w-4 h-4 border-2 border-t-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span>
				)}
				{isFetchingNextPage
					? "Loading..."
					: firstLoad && !hasNextPage
						? "No More Products"
						: "Show Products"}
			</Button>
		</>
	);
};

export default LoadProducts;
