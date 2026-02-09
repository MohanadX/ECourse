import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UserPurchaseTable, { Purchase } from "./UserPurchaseTable";
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

jest.mock("next/image", () => {
	const MockedImage = ({
		src,
		alt,
		...props
	}: {
		src: string;
		alt: string;
		width: number;
		height: number;
	}) => {
		// eslint-disable-next-line @next/next/no-img-element
		return <img src={src} alt={alt} {...props} />;
	};
	MockedImage.displayName = "Image";
	return MockedImage;
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
	formatPrice: (price: number) => `$${price.toFixed(2)}`,
	formatDate: (date: Date) => date.toLocaleDateString(),
	cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
}));

// Mock environment variables
jest.mock("@/data/env/client", () => ({
	env: {
		NEXT_PUBLIC_SERVER_URL: "http://localhost:3000",
	},
}));

// Mock constants
jest.mock("@/data/zodSchema/purchase", () => ({
	PURCHASES_LIMIT: 10,
}));

const createMockPurchase = (overrides?: Partial<Purchase>) => ({
	id: "purchase-1",
	pricePaidInCents: 1000, // $10.00
	createdAt: new Date("2023-01-01"),
	refundedAt: null,
	productDetails: {
		name: "Test Product",
		description: "Test Description",
		imageUrl: "/test-image.jpg",
	},
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

describe("UserPurchaseTable Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Rendering", () => {
		it("should render table with purchases", () => {
			const mockPurchases = [createMockPurchase()];

			renderWithQueryClient(
				<UserPurchaseTable
					initialPurchases={mockPurchases}
					purchasesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			// Check table headers
			expect(
				screen.getByRole("columnheader", { name: /Product/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("columnheader", { name: /Amount/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("columnheader", { name: /Actions/i }),
			).toBeInTheDocument();

			// Check row content
			expect(screen.getByText("Test Product")).toBeInTheDocument();
			// Check price $10.00 (1000 cents / 100)
			expect(screen.getByText("$10.00")).toBeInTheDocument();

			// Check image
			const img = screen.getByAltText("Test Product");
			expect(img).toBeInTheDocument();
			expect(img).toHaveAttribute("src", "/test-image.jpg");
		});
	});

	describe("Status and Actions", () => {
		it("should display Refunded badge if purchase is refunded", () => {
			const mockPurchases = [
				createMockPurchase({ refundedAt: new Date("2023-01-02") }),
			];

			renderWithQueryClient(
				<UserPurchaseTable
					initialPurchases={mockPurchases}
					purchasesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("Refunded")).toBeInTheDocument();
			expect(screen.queryByText("$10.00")).not.toBeInTheDocument();
		});

		it("should have correct Detail link", () => {
			const mockPurchases = [createMockPurchase({ id: "purchase-123" })];

			renderWithQueryClient(
				<UserPurchaseTable
					initialPurchases={mockPurchases}
					purchasesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const detailsLink = screen.getByRole("link", { name: /Details/i });
			expect(detailsLink).toHaveAttribute("href", "/purchases/purchase-123");
		});
	});

	describe("Pagination", () => {
		it("should not render pagination when purchases count is below limit", () => {
			const mockPurchases = [createMockPurchase()];

			renderWithQueryClient(
				<UserPurchaseTable
					initialPurchases={mockPurchases}
					purchasesCount={5}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
		});
	});

	describe("Empty State", () => {
		it("should render successfully with 0 purchases", () => {
			renderWithQueryClient(
				<UserPurchaseTable
					initialPurchases={[]}
					purchasesCount={0}
					initialPage={1}
					totalPages={1}
				/>,
			);

			// Should render headers
			expect(
				screen.getByRole("columnheader", { name: /Product/i }),
			).toBeInTheDocument();
		});
	});
});
