import CourseForm from "@/components/courses/CourseForm";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCourse } from "@/features/course/db/course";
import { notFound } from "next/navigation";

const EditPage = async ({
	params,
}: {
	params: Promise<{ courseId: string }>;
}) => {
	const id = (await params).courseId;

	const course = await getCourse(id);

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
				<TabsContent value="lessons">Lessons</TabsContent>
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
