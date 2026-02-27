import { render, screen, waitFor } from "@testing-library/react";
import { CapacityDashboard } from "@/components/CapacityDashboard";
import type { VelocityForecast } from "@/types";

const mockForecast: VelocityForecast = {
  velocity: 10.75,
  std_dev: 2.1,
  capacity: 14.2,
  demand: 8,
  demand_task_count: 4,
  burnout_risk: false,
  probability_of_success: 0.92,
  data_points: 12,
  weekly_totals: [
    { week_label: "2026-W05", total_effort: 10 },
    { week_label: "2026-W06", total_effort: 12 },
    { week_label: "2026-W07", total_effort: 8 },
    { week_label: "2026-W08", total_effort: 14 },
    { week_label: "2026-W09", total_effort: 10 },
  ],
};

const mockBurnoutForecast: VelocityForecast = {
  ...mockForecast,
  burnout_risk: true,
  demand: 25,
  probability_of_success: 0.05,
};

jest.mock("@/lib/api", () => ({
  fetchVelocityForecast: jest.fn(),
}));

import { fetchVelocityForecast } from "@/lib/api";
const mockedFetch = fetchVelocityForecast as jest.MockedFunction<
  typeof fetchVelocityForecast
>;

describe("CapacityDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state initially", () => {
    mockedFetch.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<CapacityDashboard />);
    // Loading skeleton has an animate-pulse class
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  test("renders forecast data after loading", async () => {
    mockedFetch.mockResolvedValue(mockForecast);
    render(<CapacityDashboard />);

    await waitFor(() => {
      expect(screen.getByText("92%")).toBeInTheDocument();
    });

    expect(screen.getByText("10.8")).toBeInTheDocument(); // velocity
    expect(screen.getByText("8")).toBeInTheDocument(); // demand
  });

  test("renders burnout risk badge when flagged", async () => {
    mockedFetch.mockResolvedValue(mockBurnoutForecast);
    render(<CapacityDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("burnout-badge")).toBeInTheDocument();
    });

    expect(screen.getByText("Burnout risk")).toBeInTheDocument();
  });

  test("does not render burnout badge when no risk", async () => {
    mockedFetch.mockResolvedValue(mockForecast);
    render(<CapacityDashboard />);

    await waitFor(() => {
      expect(screen.getByText("92%")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("burnout-badge")).not.toBeInTheDocument();
  });

  test("renders probability gauge with correct percentage", async () => {
    mockedFetch.mockResolvedValue(mockForecast);
    render(<CapacityDashboard />);

    await waitFor(() => {
      const gauge = screen.getByTestId("probability-gauge");
      expect(gauge).toBeInTheDocument();
      const bar = gauge.querySelector("div");
      expect(bar).toHaveStyle({ width: "92%" });
    });
  });

  test("renders empty state when probability is null (new user)", async () => {
    const newUserForecast: VelocityForecast = {
      ...mockForecast,
      velocity: 0,
      std_dev: 0,
      capacity: 0,
      demand: 5,
      probability_of_success: null,
      data_points: 12,
    };
    mockedFetch.mockResolvedValue(newUserForecast);
    render(<CapacityDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Complete some tasks to see predictions"),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("%")).not.toBeInTheDocument();
    expect(screen.queryByTestId("burnout-badge")).not.toBeInTheDocument();
  });

  test("handles API error gracefully", async () => {
    mockedFetch.mockRejectedValue(new Error("Network error"));
    render(<CapacityDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load forecast.")).toBeInTheDocument();
    });

    expect(screen.getByText("Retry")).toBeInTheDocument();
  });
});
