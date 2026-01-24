import PageHeader from "@/components/PageHeader";
import SkeletonButton, {
	SkeletonArray,
	SkeletonText,
} from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import {
	CourseSectionTable,
	CourseTable,
	LessonTable,
	UserCourseAccessTable,
	UserLessonProgressTable,
} from "@/drizzle/schema";
import { getCourseIdTag, getUserCoursesTag } from "@/features/course/db/cache";
import { getUserCourseAccessUserTag } from "@/features/course/db/CourseAccessCache";
import { getCourseLessonsTag } from "@/features/lessons/db/cache";
import { wherePublicLessons } from "@/features/lessons/db/lessons";
import { getLessonProgressUserTag } from "@/features/lessons/db/userLessonProgressCache";
import { getCourseSectionsTag } from "@/features/sections/db/cache";
import { wherePublicCourseSections } from "@/features/sections/db/sections";
import { getCurrentUser } from "@/features/users/db/clerk";
import { and, countDistinct, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { COURSES_LIMIT } from "@/data/zodSchema/course";
import CourseGridClient from "@/components/courses/CourseGridClient";

export default function CoursesPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	return (
		<main className="containers my-6">
			<PageHeader title="My Courses" />
			<Suspense
				fallback={
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						<SkeletonArray amount={3}>
							<SkeletonCourseCard />
						</SkeletonArray>
					</div>
				}
			>
				<CourseGrid searchParams={searchParams} />
			</Suspense>
		</main>
	);
}

async function CourseGrid({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const { userId, redirectToSignIn } = await getCurrentUser();

	if (!userId) return redirectToSignIn();

	const { page: pageParam } = await searchParams;
	const page = Number(pageParam ?? 1);
	const skip = (page - 1) * COURSES_LIMIT;

	const [courses, [coursesNumber]] = await getUserCourses(
		userId,
		COURSES_LIMIT,
		skip,
	);
	const coursesCount = coursesNumber.coursesCount ?? 0;

	const totalPages = Math.ceil(coursesCount / COURSES_LIMIT);

	if (courses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center col-start-1 col-end-4 gap-4">
				You have no courses yet
				<Button asChild size={"lg"}>
					<Link href={"/"}>Try Browsing Courses</Link>
				</Button>
			</div>
		);
	}

	return (
		<CourseGridClient
			initialCourses={courses}
			coursesCount={coursesCount}
			initialPage={page}
			totalPages={totalPages}
		/>
	);
}

async function getUserCourses(userId: string, limit: number, skip: number) {
	"use cache";
	cacheTag(
		getUserCoursesTag(userId),
		getUserCourseAccessUserTag(userId),
		getLessonProgressUserTag(userId),
	);

	return Promise.all([
		db
			.select({
				id: CourseTable.id,
				name: CourseTable.name,
				slug: CourseTable.slug,
				description: CourseTable.description,
				sectionsCount: countDistinct(CourseSectionTable.id),
				lessonsCount: countDistinct(LessonTable.id),
				lessonCompleted: countDistinct(UserLessonProgressTable.lessonId),
			})
			.from(CourseTable)
			.innerJoin(
				UserCourseAccessTable,
				and(
					eq(UserCourseAccessTable.courseId, CourseTable.id),
					eq(UserCourseAccessTable.userId, userId),
				),
			)
			.leftJoin(
				CourseSectionTable,
				and(
					eq(CourseSectionTable.courseId, CourseTable.id),
					wherePublicCourseSections,
				),
			)
			.leftJoin(
				LessonTable,
				and(
					eq(LessonTable.sectionId, CourseSectionTable.id),
					wherePublicLessons,
				),
			)
			.leftJoin(
				UserLessonProgressTable,
				and(
					eq(UserLessonProgressTable.lessonId, LessonTable.id),
					eq(UserLessonProgressTable.userId, userId),
				),
			)
			.orderBy(CourseTable.name)
			.groupBy(CourseTable.id)
			.limit(limit)
			.offset(skip)
			.then((courses) => {
				courses.forEach((course) => {
					cacheTag(getCourseIdTag(course.id));
					cacheTag(getCourseSectionsTag(course.id));
					cacheTag(getCourseLessonsTag(course.id));
				});
				return courses;
			}),
		db
			.select({
				coursesCount: countDistinct(CourseTable.id),
			})
			.from(CourseTable)
			.innerJoin(
				UserCourseAccessTable,
				and(
					eq(UserCourseAccessTable.courseId, CourseTable.id),
					eq(UserCourseAccessTable.userId, userId),
				),
			),
	]);
}

function SkeletonCourseCard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<SkeletonText className="w-3/4" />
				</CardTitle>
				<CardDescription>
					<SkeletonText className="w-1/2" />
				</CardDescription>
			</CardHeader>
			<CardContent>
				<SkeletonText rows={3} />
			</CardContent>
			<CardFooter>
				<SkeletonButton className="w-20" />
			</CardFooter>
		</Card>
	);
}
