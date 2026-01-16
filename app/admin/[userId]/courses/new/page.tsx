import CourseForm from "@/components/courses/CourseForm";
import PageHeader from "@/components/PageHeader";

const page = () => {
	return (
		<main className="containers mt-6">
			<PageHeader title="New Course" />
			<CourseForm />
		</main>
	);
};

export default page;
