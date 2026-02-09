import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PurchaseTable, { Purchase } from "./PurchaseTable";
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

jest.mock("@/features/actions/purchase", () => ({
	refundPurchase: jest.fn(),
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
	user: {
		name: "Test User",
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

describe("PurchaseTable Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Rendering", () => {
		it("should render table with purchases", () => {
			const mockPurchases = [createMockPurchase()];

			renderWithQueryClient(
				<PurchaseTable
					initialPurchases={mockPurchases}
					purchasesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			// Check table headers
			expect(
				screen.getByRole("columnheader", { name: /Sale/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("columnheader", { name: /Customer Name/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("columnheader", { name: /Amount/i }),
			).toBeInTheDocument();

			// Check row content
			expect(screen.getByText("Test Product")).toBeInTheDocument();
			// Date depends on locale, mock implementation uses toLocaleDateString()
			// Mock date is 2023-01-01.
			// Let's check for "Test User"
			expect(screen.getByText("Test User")).toBeInTheDocument();
			// Check price $10.00 (1000 cents / 100)
			expect(screen.getByText("$10.00")).toBeInTheDocument();

			// Check image
			const img = screen.getByAltText("Test Product");
			expect(img).toBeInTheDocument();
			expect(img).toHaveAttribute("src", "/test-image.jpg");
		});
	});

	describe("Refund Status", () => {
		it("should display Refunded badge if purchase is refunded", () => {
			const mockPurchases = [
				createMockPurchase({ refundedAt: new Date("2023-01-02") }),
			];

			renderWithQueryClient(
				<PurchaseTable
					initialPurchases={mockPurchases}
					purchasesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("Refunded")).toBeInTheDocument();
			// Should NOT display price
			expect(screen.queryByText("$10.00")).not.toBeInTheDocument();
		});

		it("should display Refund button if purchase is not refunded and price > 0", () => {
			const mockPurchases = [createMockPurchase()];

			renderWithQueryClient(
				<PurchaseTable
					initialPurchases={mockPurchases}
					purchasesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			// Check for Refund button text
			// ActionButton renders children, so "Refund" text should be present.
			expect(screen.getByText("Refund")).toBeInTheDocument();
		});

		it("should NOT display Refund button if purchase price is 0", () => {
			const mockPurchases = [createMockPurchase({ pricePaidInCents: 0 })];

			renderWithQueryClient(
				<PurchaseTable
					initialPurchases={mockPurchases}
					purchasesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.queryByText("Refund")).not.toBeInTheDocument();
		});

		it("should NOT display Refund button if purchase is already refunded", () => {
			const mockPurchases = [
				createMockPurchase({ refundedAt: new Date(), pricePaidInCents: 1000 }),
			];

			renderWithQueryClient(
				<PurchaseTable
					initialPurchases={mockPurchases}
					purchasesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			// "Refund" text might appear in "Refunded" badge? No, badge says "Refunded". Button says "Refund".
			// But check regex carefully.
			// The button text is exactly "Refund".
			// Badge text is "Refunded".

			// We can query for button role specifically if ActionButton renders a button.
			// ActionButton usually renders a button or a form submission trigger.
			// Assuming it renders something distinguishable.
			// Or just queryByText("Refund", { selector: "button" }) if we knew the tag.
			// But queryByText("Refund") should act differently from "Refunded".

			// Let's rely on the text being distinct enough or check badge presence vs button absence.
			expect(screen.getByText("Refunded")).toBeInTheDocument();

			// If I search strict match:
			// getByText("Refund") would fail if only "Refunded" exists? No, partial match setting default is false.
			// But "Refunded" contains "Refund".
			// If I use exact: true (default), "Refunded" != "Refund".

			expect(
				screen.queryByText("Refund", { exact: true }),
			).not.toBeInTheDocument();
		});
	});

	describe("Pagination", () => {
		it("should not render pagination when purchases count is below limit", () => {
			const mockPurchases = [createMockPurchase()];

			renderWithQueryClient(
				<PurchaseTable
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
				<PurchaseTable
					initialPurchases={[]}
					purchasesCount={0}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("Sales")).toBeInTheDocument();
		});
	});
});
