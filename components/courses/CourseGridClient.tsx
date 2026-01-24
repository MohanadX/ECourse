"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { COURSES_LIMIT } from "@/data/zodSchema/course";
import { env } from "@/data/env/client";
import axios from "axios";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { formatPlural } from "@/lib/utils";
import Pagination from "../Pagination";

type Course = {
	id: string;
	name: string;
	slug: string;
	description: string;
	sectionsCount: number;
	lessonsCount: number;
	lessonCompleted: number;
};

type Props = {
	initialCourses: Course[];
	coursesCount: number;
	initialPage: number;
	totalPages: number;
};

async function getCoursesPaginated(page: number): Promise<Course[]> {
	const res = await axios.get<Course[]>(
		`${env.NEXT_PUBLIC_SERVER_URL}/api/consumer/courses`,
		{
			params: {
				page,
			},
		},
	);

	return res.data;
}

export default function CourseGridClient({
	initialCourses,
	coursesCount,
	initialPage,
	totalPages,
}: Props) {
	const [page, setPage] = useState(initialPage);

	const { data: courses, isFetching } = useQuery<Course[]>({
		queryKey: ["userCoursesP", page],
		queryFn: () => getCoursesPaginated(page),
		initialData: page === initialPage ? initialCourses : undefined,
		staleTime: 60 * 1000 * 5, // 5 min
		placeholderData: keepPreviousData,
	});

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{courses!.map((course) => (
					<Card
						key={course.id}
						className="flex flex-col relative overflow-hidden"
					>
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
						<CardContent
							className="line-clamp-3 grow"
							title={course.description}
						>
							{/* title show use the rest of the text on hover */}
							{course.description}
						</CardContent>
						<CardFooter>
							<Button asChild>
								<Link href={`/courses/${course.id}/${course.slug}`}>
									View Course
								</Link>
							</Button>
						</CardFooter>
						<div
							className="bg-accent h-2 absolute bottom-0"
							style={{
								width: `${course.lessonsCount > 0 ? (course.lessonCompleted / course.lessonsCount) * 100 : 0}%`,
							}}
						/>
					</Card>
				))}
			</div>
			{coursesCount > COURSES_LIMIT && (
				<div className="mx-auto w-fit mt-6">
					<Pagination
						currentPage={page}
						totalPages={totalPages}
						setPage={setPage}
					/>
					{isFetching && (
						<div className="load">
							<div className="circle l1"></div>
							<div className="circle l2"></div>
							<div className="circle l3"></div>
							<div className="circle l4"></div>
						</div>
					)}
				</div>
			)}
		</>
	);
}
