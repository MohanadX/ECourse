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
		<div className="grid relative layout  gap-8 containers">
			<input id="course-sidebar" type="checkbox" className="peer hidden" />
			<label
				htmlFor="course-sidebar"
				className="md:hidden p-2 cursor-pointer w-6 text-foreground"
				aria-label="Toggle course menu"
				role="button"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="w-6 h-6"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
					/>
				</svg>
			</label>
			<aside className="py-4 absolute md:static overflow-y-auto max-md:max-h-[500px] bg-background shadow md:shadow-none border-r md:border-none p-2 -left-[250px] peer-checked:left-1 top-8 md:top-0 md:left-0 sidebar-move transition-all">
				<h1 className="text-lg font-semibold hover:underline">
					<Link href={`/courses/${course.id}/${course.slug}`}>
						{course.name}
					</Link>
				</h1>

				<Suspense fallback={"Sidebar"}>
					<SuspenseBoundary course={course} />
				</Suspense>
			</aside>
			<main className="my-6">{children}</main>
		</div>
	);
}

async function SuspenseBoundary({ course }: { course: Course }) {
	const { userId } = await getCurrentUser();
	const completedLessonIds = !userId ? [] : await getCompletedLessonIds(userId);

	return <CoursePageClient course={mapCourse(course, completedLessonIds)} />;
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
		getCourseLessonsTag(courseId),
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
