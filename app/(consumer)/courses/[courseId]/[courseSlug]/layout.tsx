import { db } from "@/drizzle/db";
import {
	CourseSectionTable,
	CourseTable,
	LessonTable,
	UserLessonProgressTable,
} from "@/drizzle/schema";
import { getCourseIdTag } from "@/features/course/db/cache";
import { getCourseLessonsTag } from "@/features/lessons/db/cache";
import { wherePublicLessons } from "@/features/lessons/db/lessons";
import { getCourseSectionsTag } from "@/features/sections/db/cache";
import { wherePublicCourseSections } from "@/features/sections/db/sections";
import { getCurrentUser } from "@/features/users/db/clerk";
import { asc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { ReactNode, Suspense } from "react";
import { CoursePageClient } from "./_client";
import { getLessonProgressUserTag } from "@/features/lessons/db/userLessonProgressCache";
import Link from "next/link";

type Course = {
	name: string;
	slug: string;
	id: string;
	CourseSections: {
		id: string;
		name: string;
		lessons: {
			id: string;
			name: string;
		}[];
	}[];
};

export default async function CoursePageLayout({
	params,
	children,
}: {
	params: Promise<{ courseId: string }>;
	children: ReactNode;
}) {
	const { courseId } = await params;
	return (
		<Suspense fallback={null}>
			<LayoutCourse courseId={courseId}>{children}</LayoutCourse>
		</Suspense>
	);
}

async function LayoutCourse({
	courseId,
	children,
}: {
	courseId: string;
	children: ReactNode;
}) {
	const course = await getCourse(courseId);

	if (!course) return notFound();

	return (
		<div className="grid layout gap-8 containers">
			<aside className="py-4">
				<h1 className="text-lg font-semibold hover:underline">
					<Link href={`/courses/${course.id}/${course.slug}`}>
						{course.name}
					</Link>
				</h1>
				<Suspense fallback={"Sidebar"}>
					<SuspenseBoundary course={course} />
				</Suspense>
			</aside>
			<main className="my-6 containers">{children}</main>
		</div>
	);
}

async function SuspenseBoundary({ course }: { course: Course }) {
	const { userId } = await getCurrentUser();
	const completedLessonIds = !userId ? [] : await getCompletedLessonIds(userId);

	return <CoursePageClient course={mapCourse(course, [])} />;
}

async function getCompletedLessonIds(userId: string) {
	"use cache";
	cacheTag(getLessonProgressUserTag(userId));
	const data = await db.query.UserLessonProgressTable.findMany({
		columns: { lessonId: true },
		where: eq(UserLessonProgressTable.userId, userId),
	});

	return data.map(({ lessonId }) => lessonId);
}

async function getCourse(courseId: string) {
	"use cache";
	cacheTag(
		getCourseIdTag(courseId),
		getCourseSectionsTag(courseId),
		getCourseLessonsTag(courseId)
	);

	return db.query.CourseTable.findFirst({
		where: eq(CourseTable.id, courseId),
		columns: {
			id: true,
			name: true,
			slug: true,
		},
		with: {
			CourseSections: {
				orderBy: asc(CourseSectionTable.order),
				where: wherePublicCourseSections,
				columns: {
					id: true,
					name: true,
				},
				with: {
					lessons: {
						orderBy: asc(LessonTable.order),
						where: wherePublicLessons,
						columns: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
	});
}

function mapCourse(course: Course, completedLessonIds: string[]) {
	return {
		...course,
		CourseSections: course.CourseSections.map((section) => {
			return {
				...section,
				lessons: section.lessons.map((lesson) => {
					return {
						...lesson,
						isComplete: completedLessonIds.includes(lesson.id),
					};
				}),
			};
		}),
	};
}
