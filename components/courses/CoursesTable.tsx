"use client";

import { formatPlural } from "@/lib/utils";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import Link from "next/link";
import { Trash2Icon } from "lucide-react";
import ActionButton from "../ActionButton";
import { deleteCourse } from "@/features/actions/course";
import Pagination from "../Pagination";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { COURSES_LIMIT } from "@/data/zodSchema/course";
import { env } from "@/data/env/client";
import axios from "axios";

type Course = {
	id: string;
	name: string;
	sectionsCount: number;
	lessonsCount: number;
	studentsCount: number;
};

type Props = {
	initialCourses: Course[];
	coursesCount: number;
	initialPage: number;
	totalPages: number;
};

async function getCoursesPaginated(page: number): Promise<Course[]> {
	const res = await axios.get<Course[]>(
		`${env.NEXT_PUBLIC_SERVER_URL}/api/admin/courses`,
		{
			params: {
				page,
			},
		},
	);

	return res.data;
}

const CoursesTable = ({
	initialCourses,
	coursesCount,
	initialPage,
	totalPages,
}: Props) => {
	const [page, setPage] = useState(initialPage);

	const { data: courses, isFetching } = useQuery<Course[]>({
		queryKey: ["coursesP", page],
		queryFn: () => getCoursesPaginated(page),
		initialData: page === initialPage ? initialCourses : undefined,
		staleTime: 60 * 1000 * 5, // 5 min
		placeholderData: keepPreviousData,
	});

	return (
		<>
			<Table className="min-w-[300px]">
				<TableHeader>
					<TableRow>
						<TableHead>
							{formatPlural(courses!.length, {
								singular: "Course",
								plural: "Courses",
							})}
						</TableHead>
						<TableHead className="text-center">Students</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{courses!.map((course) => (
						<TableRow key={course.id}>
							<TableCell>
								<div className="flex flex-col gap-1">
									<span className="font-semibold">{course.name}</span>
									<p className="text-muted-foreground">
										{" "}
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
									</p>
								</div>
							</TableCell>
							<TableCell className="text-center">
								{course.studentsCount}
							</TableCell>
							<TableCell>
								<div className="flex gap-2">
									<Button asChild>
										<Link href={`courses/${course.id}/edit`}>Edit</Link>
									</Button>
									<ActionButton
										className="cursor-pointer"
										requireAreYouSure
										pagination={["coursesP", page]}
										variant={"destructiveOutline"}
										action={deleteCourse.bind(null, course.id)}
										aria-label="Delete" // instead of using sr-only
									>
										<Trash2Icon aria-hidden />
									</ActionButton>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{coursesCount > COURSES_LIMIT && (
				<div className="mx-auto w-fit">
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
};

export default CoursesTable;
