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
import { getCourseIdTag } from "@/features/course/db/cache";
import { formatPlural } from "@/features/course/db/course";
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

export default function CoursesPage() {
	return (
		<main className="containers my-6">
			<PageHeader title="My Courses" />
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				<Suspense
					fallback={
						<SkeletonArray amount={3}>
							<SkeletonCourseCard />
						</SkeletonArray>
					}
				>
					<CourseGrid />
				</Suspense>
			</div>
		</main>
	);
}

async function CourseGrid() {
	const { userId, redirectToSignIn } = await getCurrentUser();

	if (!userId) return redirectToSignIn();

	const courses = await getUserCourses(userId);

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

	return courses.map((course) => (
		<Card key={course.id} className="flex flex-col relative overflow-hidden">
			<CardHeader>
				<CardTitle>{course.name}</CardTitle>
				<CardDescription>
					{formatPlural(course.sectionsCount, {
						singular: "section",
						plural: "sections",
						includeCount: true,
					})}{" "}
					•{" "}
					{formatPlural(course.lessonsCount, {
						singular: "lesson",
						plural: "lessons",
						includeCount: true,
					})}
				</CardDescription>
			</CardHeader>
			<CardContent className="line-clamp-3 grow" title={course.description}>
				{/* title show use the rest of the text on hover */}
				{course.description}
			</CardContent>
			<CardFooter>
				<Button asChild>
					<Link href={`/courses/${course.id}/${course.slug}`}>View Course</Link>
				</Button>
			</CardFooter>
			<div
				className="bg-accent h-2 absolute bottom-0"
				style={{
					width: `${(course.lessonCompleted / course.lessonsCount) * 100}%`,
				}}
			/>
		</Card>
	));
}

async function getUserCourses(userId: string) {
	"use cache";
	cacheTag(
		getUserCourseAccessUserTag(userId),
		getLessonProgressUserTag(userId)
	);

	const courses = await db
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
				eq(UserCourseAccessTable.userId, userId)
			)
		)
		.leftJoin(
			CourseSectionTable,
			and(
				eq(CourseSectionTable.courseId, CourseTable.id),
				wherePublicCourseSections
			)
		)
		.leftJoin(
			LessonTable,
			and(eq(LessonTable.sectionId, CourseSectionTable.id), wherePublicLessons)
		)
		.leftJoin(
			UserLessonProgressTable,
			and(
				eq(UserLessonProgressTable.lessonId, LessonTable.id),
				eq(UserLessonProgressTable.userId, userId)
			)
		)
		.orderBy(CourseTable.name)
		.groupBy(CourseTable.id);

	courses.forEach((course) => {
		cacheTag(getCourseIdTag(course.id));
		cacheTag(getCourseSectionsTag(course.id));
		cacheTag(getCourseLessonsTag(course.id));
	});

	return courses;
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
