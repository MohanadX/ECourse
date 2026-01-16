"use client";

import { expireRefundPurchaseDate, formatTimeDuration } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function PurchaseRefundTimer({
	purchaseTime,
}: {
	purchaseTime: Date;
}) {
	const { howMuchTimeLeft } = expireRefundPurchaseDate(purchaseTime);
	const [remainingTime, setRemainingTime] = useState(howMuchTimeLeft);

	useEffect(() => {
		const timer = setInterval(() => {
			setRemainingTime((prev) => prev - 1000);
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	return (
		<p>Time till refund period expire: {formatTimeDuration(remainingTime)}</p>
	);
}
