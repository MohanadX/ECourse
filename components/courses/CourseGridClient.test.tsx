import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CourseGridClient, { Course } from "./CourseGridClient";
import { ComponentType, useEffect, useState } from "react";

// Mock external dependencies
jest.mock("next/link", () => {
	const MockedLink = ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => {
		return <a href={href}>{children}</a>;
	};
	MockedLink.displayName = "Link";
	return MockedLink;
});

jest.mock("next/dynamic", () => ({
	__esModule: true,
	default: (fn: () => Promise<unknown>) => {
		const Component = (props: unknown) => {
			const [Comp, setComp] = useState<ComponentType<unknown> | null>(null);
			useEffect(() => {
				fn().then((mod: unknown) => {
					const modContent = mod as { default?: ComponentType<unknown> };
					setComp(() => modContent.default || (mod as ComponentType<unknown>));
				});
			}, []);
			return Comp ? <Comp {...(props as object)} /> : null;
		};
		Component.displayName = "DynamicComponent";
		return Component;
	},
}));

jest.mock("axios");

// Mock utilities
jest.mock("@/lib/utils", () => ({
	formatPlural: (
		count: number,
		options: { singular: string; plural: string; includeCount?: boolean },
	) => {
		const label = count === 1 ? options.singular : options.plural;
		return options.includeCount ? `${count} ${label}` : label;
	},
	cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
}));

// Mock environment variables
jest.mock("@/data/env/client", () => ({
	env: {
		NEXT_PUBLIC_SERVER_URL: "http://localhost:3000",
	},
}));

// Mock constants
jest.mock("@/data/zodSchema/course", () => ({
	COURSES_LIMIT: 10,
}));

// Mock UI components if necessary, but we can rely on standard rendering for simple divs/headers
// However, Card components are imported from "../ui/card".
// If specific tests fail due to Card structure, we can mock it, but usually standard UI/shadcn components render divs.

const createMockCourse = (overrides?: Partial<Course>) => ({
	id: "course-1",
	name: "Test Course",
	slug: "test-course",
	description: "This is a test course description that is long enough.",
	sectionsCount: 5,
	lessonsCount: 20,
	lessonCompleted: 0,
	...overrides,
});

const renderWithQueryClient = (ui: React.ReactElement) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	);
};

describe("CourseGridClient Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Rendering", () => {
		it("should render grid of courses", () => {
			const mockCourses = [createMockCourse()];

			renderWithQueryClient(
				<CourseGridClient
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("Test Course")).toBeInTheDocument();
			expect(
				screen.getByText(
					"This is a test course description that is long enough.",
				),
			).toBeInTheDocument();
			expect(screen.getByText(/5 sections/)).toBeInTheDocument();
			expect(screen.getByText(/20 lessons/)).toBeInTheDocument();
		});

		it("should render multiple courses", () => {
			const mockCourses = [
				createMockCourse({ id: "1", name: "Course 1" }),
				createMockCourse({ id: "2", name: "Course 2" }),
			];

			renderWithQueryClient(
				<CourseGridClient
					initialCourses={mockCourses}
					coursesCount={2}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("Course 1")).toBeInTheDocument();
			expect(screen.getByText("Course 2")).toBeInTheDocument();
		});
	});

	describe("Interactions", () => {
		it("should have correct link to view course", () => {
			const mockCourses = [
				createMockCourse({ id: "course-123", slug: "my-course" }),
			];

			renderWithQueryClient(
				<CourseGridClient
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const link = screen.getByRole("link", { name: /view course/i });
			expect(link).toHaveAttribute("href", "/courses/course-123/my-course");
		});
	});

	// Progress bar test:
	// The component renders a progress bar with width style.
	// We can try to test style attributes.
	// width: `${course.lessonsCount > 0 ? (course.lessonCompleted / course.lessonsCount) * 100 : 0}%`

	describe("Progress Bar", () => {
		it("should calculate progress width correctly", () => {
			const mockCourses = [
				createMockCourse({
					lessonsCount: 10,
					lessonCompleted: 5,
				}),
			];

			const { container } = renderWithQueryClient(
				<CourseGridClient
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			// Find by class regex or structure
			// "bg-accent h-2 absolute bottom-0"
			// Since we can't easily query by style or class in standardized way without setup,
			// we can use container.querySelector
			const progressBar = container.querySelector(
				".bg-accent.h-2.absolute.bottom-0",
			);
			expect(progressBar).toHaveStyle({ width: "50%" });
		});

		it("should handle 0 lessons division by zero check", () => {
			const mockCourses = [
				createMockCourse({
					lessonsCount: 0,
					lessonCompleted: 0,
				}),
			];

			const { container } = renderWithQueryClient(
				<CourseGridClient
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const progressBar = container.querySelector(
				".bg-accent.h-2.absolute.bottom-0",
			);
			expect(progressBar).toHaveStyle({ width: "0%" });
		});
	});

	describe("Pagination", () => {
		it("should not render pagination when courses count is below limit", () => {
			const mockCourses = [createMockCourse()];

			renderWithQueryClient(
				<CourseGridClient
					initialCourses={mockCourses}
					coursesCount={5}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
		});
	});

	describe("Empty State", () => {
		it("should render successfully with 0 courses", () => {
			renderWithQueryClient(
				<CourseGridClient
					initialCourses={[]}
					coursesCount={0}
					initialPage={1}
					totalPages={1}
				/>,
			);
			// Should render container div but no cards.
			// Just ensure no crash.
			// Check that no "View Course" buttons exist.
			expect(screen.queryByText("View Course")).not.toBeInTheDocument();
		});
	});
});
