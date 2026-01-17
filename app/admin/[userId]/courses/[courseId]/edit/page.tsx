import CourseForm from "@/components/courses/CourseForm";
import LessonFormDialog from "@/components/courses/LessonFormDialog";
import SectionFormDialog from "@/components/courses/SectionFormDialog";
import SortableLessonList from "@/components/courses/SortableLessonList";
import SortableSectionList from "@/components/courses/SortableSectionList";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCourse } from "@/features/course/db/course";
import { cn } from "@/lib/utils";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { EyeClosedIcon, PlusIcon } from "lucide-react";
import { notFound } from "next/navigation";

const EditPage = async ({
	params,
}: {
	params: Promise<{ courseId: string; userId: string }>;
}) => {
	const { courseId, userId } = await params;

	const course = await getCourse(courseId, userId);

	if (!course) return notFound();
	return (
		<main className="containers mt-6">
			<PageHeader title={course.name} />
			<Tabs defaultValue="lessons">
				<TabsList>
					<TabsTrigger value="lessons" className="cursor-pointer">
						Lessons
					</TabsTrigger>
					<TabsTrigger value="details" className="cursor-pointer">
						Details
					</TabsTrigger>
				</TabsList>
				<TabsContent value="lessons">
					<Card>
						<CardHeader className="flex items-center justify-between">
							<CardTitle>Sections</CardTitle>
							<SectionFormDialog courseId={course.id}>
								<DialogTrigger asChild>
									<Button className="cursor-pointer" variant={"outline"}>
										<PlusIcon /> New Section
									</Button>
								</DialogTrigger>
							</SectionFormDialog>
						</CardHeader>
						<CardContent>
							<SortableSectionList
								courseId={course.id}
								sections={course.CourseSections}
							/>
						</CardContent>
					</Card>
					<hr className="my-4" />
					{course.CourseSections.map((section) => (
						<Card key={section.id} className="my-2">
							<CardHeader className="flex items-center justify-between gap-4">
								<CardTitle
									className={cn(
										"flex items-center gap-2",
										section.status === "private" && "text-muted-foreground",
									)}
								>
									{section.status === "private" && <EyeClosedIcon />}{" "}
									{section.name}
								</CardTitle>
								<LessonFormDialog
									defaultSectionId={section.id}
									sections={course.CourseSections}
								>
									<DialogTrigger asChild>
										<Button className="cursor-pointer" variant={"outline"}>
											<PlusIcon /> New Lesson
										</Button>
									</DialogTrigger>
								</LessonFormDialog>
							</CardHeader>
							<CardContent>
								<SortableLessonList
									sections={course.CourseSections}
									lessons={section.lessons}
								/>
							</CardContent>
						</Card>
					))}
				</TabsContent>
				<TabsContent value="details">
					<Card>
						<CardHeader>
							<CourseForm course={course} />
						</CardHeader>
					</Card>
				</TabsContent>
			</Tabs>
		</main>
	);
};

export default EditPage;
