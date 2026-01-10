import { formatPlural } from "@/features/course/db/course";
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

type Props = {
	courses: {
		id: string;
		name: string;
		sectionsCount: number;
		lessonsCount: number;
		studentsCount: number;
	}[];
};

const CoursesTable = ({ courses }: Props) => {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>
						{formatPlural(courses.length, {
							singular: "Course",
							plural: "Courses",
						})}
					</TableHead>
					<TableHead>Students</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{courses.map((course) => (
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
						<TableCell>{course.studentsCount}</TableCell>
						<TableCell>
							<div className="flex gap-2">
								<Button asChild>
									<Link href={`courses/${course.id}/edit`}>Edit</Link>
								</Button>
								<ActionButton
									className="cursor-pointer"
									requireAreYouSure
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
	);
};

export default CoursesTable;
