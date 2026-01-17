import ActionButton from "@/components/ActionButton";
import ToLessonButton from "@/components/courses/ToLessonButton";
import SkeletonButton from "@/components/Skeletons";
import YoutubeVideoPlayer from "@/components/YoutubeVideoPlayer";
import { db } from "@/drizzle/db";
import {
	CourseSectionTable,
	lessonStatus,
	LessonTable,
	UserLessonProgressTable,
} from "@/drizzle/schema";
import { mutateLessonCompleteStatus } from "@/features/actions/UserLessonCompletion";
import { getLessonIdTag } from "@/features/lessons/db/cache";
import {
	canViewLesson,
	wherePublicLessons,
} from "@/features/lessons/db/lessons";
import { getLessonProgressUserTag } from "@/features/lessons/db/userLessonProgressCache";
import { wherePublicCourseSections } from "@/features/sections/db/sections";
import { getCurrentUser } from "@/features/users/db/clerk";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { CheckSquare2Icon, LockIcon, XSquareIcon } from "lucide-react";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Lesson = {
	name: string;
	id: string;
	description: string | null;
	status: lessonStatus;
	youtubeVideoId: string;
	sectionId: string;
	order: number;
};

export default async function LessonPage({
	params,
}: {
	params: Promise<{ lessonId: string; courseId: string; courseSlug: string }>;
}) {
	const { lessonId, courseId, courseSlug } = await params;

	const lesson = await getLesson(lessonId);

	if (!lesson) return notFound();

	return (
		<Suspense fallback={<LoadingSkeleton />}>
			<SuspenseBoundary
				lesson={lesson}
				courseId={courseId}
				courseSlug={courseSlug}
			/>
		</Suspense>
	);
}

function LoadingSkeleton() {
	return null;
}

async function SuspenseBoundary({
	lesson,
	courseId,
	courseSlug,
}: {
	lesson: Lesson;
	courseId: string;
	courseSlug: string;
}) {
	const { userId, role, redirectToSignIn } = await getCurrentUser();
	if (!userId) return redirectToSignIn();

	const isLessonCompleted = await getIsLessonCompleted(lesson.id, userId);
	const canView = await canViewLesson(role, userId, lesson);

	return (
		<article className="my-4 flex flex-col gap-4">
			<div className="aspect-video">
				{canView ? (
					<YoutubeVideoPlayer
						videoId={lesson.youtubeVideoId}
						onFinishedVideo={
							!isLessonCompleted
								? mutateLessonCompleteStatus.bind(
										null,
										lesson.id,
										true,
										courseId,
										courseSlug,
									)
								: undefined
						}
					/>
				) : (
					<div className="flex items-center justify-center bg-primary text-primary-foreground h-full w-full">
						<LockIcon className="size-16" />
					</div>
				)}
			</div>
			<div className="flex justify-between gap-2">
				<h2 className="text-2xl font-semibold">{lesson.name}</h2>
				{canView && (
					<div className="flex gap-2">
						<Suspense fallback={<SkeletonButton className="size-16" />}>
							<ToLessonButton
								course={{ courseId, courseSlug }}
								lessonFn={getPreviousLesson}
								lesson={lesson}
							>
								Previous
							</ToLessonButton>
						</Suspense>
						<ActionButton
							action={mutateLessonCompleteStatus.bind(
								null,
								lesson.id,
								!isLessonCompleted,
								courseId,
								courseSlug,
							)}
							variant={"outline"}
						>
							<div className="flex gap-2 items-center">
								{isLessonCompleted ? (
									<>
										<XSquareIcon /> Mark Incomplete
									</>
								) : (
									<>
										<CheckSquare2Icon /> Mark Complete
									</>
								)}
							</div>
						</ActionButton>
						<Suspense fallback={<SkeletonButton className="size-16" />}>
							<ToLessonButton
								course={{ courseId, courseSlug }}
								lessonFn={getNextLesson}
								lesson={lesson}
							>
								Next
							</ToLessonButton>
						</Suspense>
					</div>
				)}
			</div>
			{canView ? (
				lesson.description && <p>{lesson.description}</p>
			) : (
				<p>This lesson is locked. Please purchase the course to view it.</p>
			)}
		</article>
	);
}

async function getNextLesson(lesson: {
	id: string;
	sectionId: string;
	order: number;
}) {
	let nextLesson = await db.query.LessonTable.findFirst({
		where: and(
			gt(LessonTable.order, lesson.order),
			eq(LessonTable.sectionId, lesson.sectionId),
			wherePublicLessons,
		),
		orderBy: asc(LessonTable.order),
		columns: {
			id: true,
		},
	});

	if (!nextLesson) {
		// if this was the first lesson in this section
		const section = await db.query.CourseSectionTable.findFirst({
			where: eq(CourseSectionTable.id, lesson.sectionId),
			columns: {
				order: true,
				courseId: true,
			},
		});

		if (!section) return;

		const nextSection = await db.query.CourseSectionTable.findFirst({
			where: and(
				gt(CourseSectionTable.order, section.order),
				eq(CourseSectionTable.courseId, section.courseId),
				wherePublicCourseSections,
			),
			orderBy: asc(CourseSectionTable.order),
			columns: {
				id: true,
			},
		});

		if (!nextSection) return; // this is the first section with the first lesson inside it

		nextLesson = await db.query.LessonTable.findFirst({
			where: and(eq(LessonTable.sectionId, nextSection.id), wherePublicLessons),
			orderBy: asc(LessonTable.order),
			columns: {
				id: true,
			},
		});
	}

	return nextLesson;
}

async function getPreviousLesson(lesson: {
	id: string;
	sectionId: string;
	order: number;
}) {
	let previousLesson = await db.query.LessonTable.findFirst({
		where: and(
			lt(LessonTable.order, lesson.order),
			eq(LessonTable.sectionId, lesson.sectionId),
			wherePublicLessons,
		),
		orderBy: desc(LessonTable.order),
		columns: {
			id: true,
		},
	});

	if (!previousLesson) {
		// if this was the first lesson in this section
		const section = await db.query.CourseSectionTable.findFirst({
			where: eq(CourseSectionTable.id, lesson.sectionId),
			columns: {
				order: true,
				courseId: true,
			},
		});

		if (!section) return;

		const previousSection = await db.query.CourseSectionTable.findFirst({
			where: and(
				lt(CourseSectionTable.order, section.order),
				eq(CourseSectionTable.courseId, section.courseId),
				wherePublicCourseSections,
			),
			orderBy: desc(CourseSectionTable.order),
			columns: {
				id: true,
			},
		});

		if (!previousSection) return; // this is the first section with the first lesson inside it

		previousLesson = await db.query.LessonTable.findFirst({
			where: and(
				eq(LessonTable.sectionId, previousSection.id),
				wherePublicLessons,
			),
			orderBy: desc(LessonTable.order),
			columns: {
				id: true,
			},
		});
	}

	return previousLesson;
}

async function getIsLessonCompleted(lessonId: string, userId: string) {
	"use cache";
	cacheTag(getLessonIdTag(lessonId), getLessonProgressUserTag(userId));

	const data = await db.query.UserLessonProgressTable.findFirst({
		where: and(
			eq(UserLessonProgressTable.userId, userId),
			eq(UserLessonProgressTable.lessonId, lessonId),
		),
	});

	return data != null;
}

async function getLesson(lessonId: string) {
	"use cache";
	cacheTag(getLessonIdTag(lessonId));

	return db.query.LessonTable.findFirst({
		columns: {
			id: true,
			name: true,
			description: true,
			youtubeVideoId: true,
			status: true,
			sectionId: true,
			order: true,
		},
		where: eq(LessonTable.id, lessonId),
	});
}
