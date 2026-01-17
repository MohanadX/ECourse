import PageLoader from "@/app/loading";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import {
	CourseSectionTable,
	CourseTable,
	LessonTable,
	ProductTable,
	PurchaseTable,
	UserCourseAccessTable,
} from "@/drizzle/schema";
import { getUserCoursesTag } from "@/features/course/db/cache";
import { getAdminCourseAccessTag } from "@/features/course/db/CourseAccessCache";
import { getAdminLessonsTag } from "@/features/lessons/db/cache";
import { getUserProductsTag } from "@/features/products/db/cache";
import { formatNumber, formatPrice } from "@/features/products/db/product";
import { getPurchaseUserTag } from "@/features/purchases/db/cache";
import { getAdminCourseSectionsTag } from "@/features/sections/db/cache";
import {
	and,
	count,
	countDistinct,
	eq,
	isNotNull,
	sql,
	sum,
} from "drizzle-orm";
import { cacheTag } from "next/cache";
import { ReactNode, Suspense } from "react";

const AdminPage = async ({
	params,
}: {
	params: Promise<{ userId: string }>;
}) => {
	const { userId } = await params;
	return (
		<main className="containers mt-6 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
			<Suspense fallback={<PageLoader className="min-h-[90vh]" />}>
				<SuspenseBoundary userId={userId} />
			</Suspense>
		</main>
	);
};

export default AdminPage;

async function SuspenseBoundary({ userId }: { userId: string }) {
	const [
		{
			netSales,
			averageNetPurchasePerCustomer,
			netPurchases,
			totalRefunds,
			refundedPurchases,
		},
		totalStudents,
		totalProducts,
		totalCourses,
		totalSections,
		totalLessons,
	] = await Promise.all([
		getPurchaseDetails(userId),
		getTotalStudents(userId),
		getAllAdminProducts(userId),
		getAllAdminCourses(userId),
		getAllAdminSections(userId),
		getAllAdminLessons(userId),
	]);

	return (
		<>
			<StatCard title="Net Sales">
				{formatPrice(netSales, { showZeroAsNumber: true })}
			</StatCard>
			<StatCard title="Refunded Sales">
				{formatPrice(totalRefunds, { showZeroAsNumber: true })}
			</StatCard>
			<StatCard title="Un-Refunded Purchases">
				{formatNumber(netPurchases)}
			</StatCard>
			<StatCard title="Refunded Purchases">
				{formatNumber(refundedPurchases)}
			</StatCard>
			<StatCard title="Purchases Per User">
				{formatNumber(averageNetPurchasePerCustomer)}
			</StatCard>
			<StatCard title="Students">{formatNumber(totalStudents)}</StatCard>
			<StatCard title="Products">{formatNumber(totalProducts)}</StatCard>
			<StatCard title="Courses">{formatNumber(totalCourses)}</StatCard>
			<StatCard title="Sections">{formatNumber(totalSections)}</StatCard>
			<StatCard title="Lessons">{formatNumber(totalLessons)}</StatCard>
		</>
	);
}

function StatCard({ title, children }: { title: string; children: ReactNode }) {
	return (
		<Card>
			<CardHeader className="text-center">
				<CardDescription>{title}</CardDescription>
				<CardTitle className="font-bold text-2xl">{children}</CardTitle>
			</CardHeader>
		</Card>
	);
}

async function getPurchaseDetails(userId: string) {
	"use cache";
	cacheTag(getPurchaseUserTag(userId));
	const data = await db
		.select({
			totalSales:
				sql<number>`COALESCE(${sum(PurchaseTable.pricePaidInCents)}, 0)`.mapWith(
					Number,
				), // to convert from string to number
			totalPurchases: count(PurchaseTable.id),
			totalUsers: countDistinct(PurchaseTable.userId),
			isRefund: isNotNull(PurchaseTable.refundedAt),
		})
		.from(PurchaseTable)
		.where(eq(PurchaseTable.adminId, userId))
		.groupBy((table) => table.isRefund); // non-refunded then refunded

	const [refundData] = data.filter((row) => row.isRefund);
	const [salesData] = data.filter((row) => !row.isRefund);

	const netSales = (salesData?.totalSales ?? 0) / 100;
	const netPurchases = salesData?.totalPurchases ?? 0;

	const totalRefunds = (refundData?.totalSales ?? 0) / 100;
	const refundedPurchases = refundData?.totalPurchases ?? 0;

	// console.log(
	// 	`totalUser: ${salesData?.totalUsers}, purchases: ${netPurchases}`,
	// );
	const averageNetPurchasePerCustomer =
		salesData.totalUsers != null && salesData.totalUsers > 0
			? netPurchases / salesData.totalUsers
			: 0;
	console.log(averageNetPurchasePerCustomer);
	return {
		netSales,
		totalRefunds,
		netPurchases,
		refundedPurchases,
		averageNetPurchasePerCustomer,
	};
}

async function getTotalStudents(userId: string) {
	"use cache";
	cacheTag(getAdminCourseAccessTag(userId));
	const [data] = await db
		.select({ totalStudents: countDistinct(UserCourseAccessTable.userId) })
		.from(UserCourseAccessTable)
		.innerJoin(CourseTable, eq(CourseTable.id, UserCourseAccessTable.courseId))
		.where(eq(CourseTable.userId, userId));

	if (!data) return 0;

	return data.totalStudents;
}

async function getAllAdminCourses(userId: string) {
	"use cache";
	cacheTag(getUserCoursesTag(userId));
	const [data] = await db
		.select({ totalCourses: count(CourseTable.id) })
		.from(CourseTable)
		.where(eq(CourseTable.userId, userId));

	if (!data) return 0;

	return data.totalCourses;
}

async function getAllAdminProducts(userId: string) {
	"use cache";
	cacheTag(getUserProductsTag(userId));
	const [data] = await db
		.select({ totalCourses: count(ProductTable.id) })
		.from(ProductTable)
		.where(eq(ProductTable.userId, userId));

	if (!data) return 0;

	return data.totalCourses;
}
async function getAllAdminSections(userId: string) {
	"use cache";
	cacheTag(getAdminCourseSectionsTag(userId));
	const [data] = await db
		.select({ totalSections: count(CourseSectionTable.id) })
		.from(CourseSectionTable)
		.innerJoin(CourseTable, eq(CourseTable.id, CourseSectionTable.courseId))
		.where(
			and(
				eq(CourseSectionTable.courseId, CourseTable.id),
				eq(CourseTable.userId, userId),
			),
		);

	if (!data) return 0;

	return data.totalSections;
}

async function getAllAdminLessons(userId: string) {
	"use cache";
	cacheTag(getAdminLessonsTag(userId));
	const [data] = await db
		.select({ totalCourses: count(LessonTable.id) })
		.from(LessonTable)
		.innerJoin(
			CourseSectionTable,
			eq(CourseSectionTable.id, LessonTable.sectionId),
		)
		.innerJoin(CourseTable, eq(CourseTable.id, CourseSectionTable.courseId))
		.where(
			and(
				eq(LessonTable.sectionId, CourseSectionTable.id),
				eq(CourseSectionTable.courseId, CourseTable.id),
				eq(CourseTable.userId, userId),
			),
		);

	if (!data) return 0;

	return data.totalCourses;
}
