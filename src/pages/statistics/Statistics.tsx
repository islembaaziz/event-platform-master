import { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Share2,
  Eye,
  Users,
  MessageSquare,
  Heart,
} from "lucide-react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface StatisticsData {
  summary: {
    totalEvents: number;
    totalMedia: number;
    totalPublications: number;
    totalUsers: number;
    totalLikes: number;
    totalComments: number;
    timeRange: string;
  };
  engagementByDay: Array<{
    date: string;
    likes: number;
    comments: number;
    views: number;
  }>;
  topPerforming: {
    events: Array<any>;
    media: Array<any>;
    publications: Array<any>;
  };
  userActivity: {
    newUsers: number;
    activeUsers: number;
  };
  contentDistribution: {
    events: number;
    images: number;
    publications: number;
  };
}

const Statistics = () => {
  const [timeRange, setTimeRange] = useState<
    "7days" | "30days" | "90days" | "12months"
  >("30days");
  const [selectedEvent, setSelectedEvent] = useState<string | "all">("all");
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Array<{ _id: string; title: string }>>(
    []
  );

  useEffect(() => {
    fetchStatistics();
    fetchEvents();
  }, [timeRange, selectedEvent]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("timeRange", timeRange);
      if (selectedEvent !== "all") {
        params.append("eventId", selectedEvent);
      }

      const { data } = await api.get(`/statistics?${params.toString()}`);
      setStatisticsData(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await api.get("/events");
      setEvents(
        data.map((event: any) => ({ _id: event._id, title: event.title }))
      );
    } catch (error) {
      console.error("Failed to fetch events for filter");
    }
  };

  if (isLoading || !statisticsData) {
    return (
      <DashboardLayout title="Statistics">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="mt-4 text-dark-500">Loading statistics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare chart data
  const engagementData = {
    labels: statisticsData.engagementByDay.map((day) =>
      new Date(day.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Likes",
        data: statisticsData.engagementByDay.map((day) => day.likes),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Comments",
        data: statisticsData.engagementByDay.map((day) => day.comments),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Views",
        data: statisticsData.engagementByDay.map((day) => day.views),
        borderColor: "#FFEB3B",
        backgroundColor: "rgba(255, 235, 59, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const contentDistributionData = {
    labels: ["Events", "Images", "Publications"],
    datasets: [
      {
        label: "Content Distribution",
        data: [
          statisticsData.contentDistribution.events,
          statisticsData.contentDistribution.images,
          statisticsData.contentDistribution.publications,
        ],
        backgroundColor: [
          "rgba(255, 235, 59, 0.8)",
          "rgba(33, 150, 243, 0.8)",
          "rgba(76, 175, 80, 0.8)",
          "rgba(156, 39, 176, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const topEventsData = {
    labels: statisticsData.topPerforming.events
      .slice(0, 5)
      .map((event) => event.title.substring(0, 20) + "..."),
    datasets: [
      {
        label: "Engagement Score",
        data: statisticsData.topPerforming.events
          .slice(0, 5)
          .map((event) => event.engagementScore),
        backgroundColor: "rgba(255, 235, 59, 0.8)",
        borderColor: "rgba(255, 235, 59, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#a3a3a3",
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(58, 58, 58, 0.5)",
        },
        ticks: {
          color: "#a3a3a3",
        },
      },
      y: {
        grid: {
          color: "rgba(58, 58, 58, 0.5)",
        },
        ticks: {
          color: "#a3a3a3",
        },
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "#a3a3a3",
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#a3a3a3",
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(58, 58, 58, 0.5)",
        },
        ticks: {
          color: "#a3a3a3",
        },
      },
      y: {
        grid: {
          color: "rgba(58, 58, 58, 0.5)",
        },
        ticks: {
          color: "#a3a3a3",
        },
      },
    },
  };

  return (
    <DashboardLayout title="Statistics">
      <div className="space-y-6">
        {/* Filters and Controls */}
        <div className="bg-dark-100 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart2 className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-white">
                Event Analytics
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center">
                <label htmlFor="event-select" className="sr-only">
                  Select Event
                </label>
                <select
                  id="event-select"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="input bg-dark-200 h-9 text-sm"
                >
                  <option value="all">All Events</option>
                  {events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-dark-500 mr-2" />
                <div className="flex rounded-md overflow-hidden">
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${
                      timeRange === "7days"
                        ? "bg-primary-500 text-dark"
                        : "bg-dark-200 text-dark-500 hover:text-white"
                    }`}
                    onClick={() => setTimeRange("7days")}
                  >
                    7 days
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${
                      timeRange === "30days"
                        ? "bg-primary-500 text-dark"
                        : "bg-dark-200 text-dark-500 hover:text-white"
                    }`}
                    onClick={() => setTimeRange("30days")}
                  >
                    30 days
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${
                      timeRange === "90days"
                        ? "bg-primary-500 text-dark"
                        : "bg-dark-200 text-dark-500 hover:text-white"
                    }`}
                    onClick={() => setTimeRange("90days")}
                  >
                    90 days
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${
                      timeRange === "12months"
                        ? "bg-primary-500 text-dark"
                        : "bg-dark-200 text-dark-500 hover:text-white"
                    }`}
                    onClick={() => setTimeRange("12months")}
                  >
                    12 months
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Total Likes</span>
              <Heart className="h-5 w-5 text-primary-500" />
            </div>
            <div className="stat-value">
              {statisticsData.summary.totalLikes.toLocaleString()}
            </div>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Total Comments</span>
              <MessageSquare className="h-5 w-5 text-primary-500" />
            </div>
            <div className="stat-value">
              {statisticsData.summary.totalComments.toLocaleString()}
            </div>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Active Users</span>
              <Users className="h-5 w-5 text-primary-500" />
            </div>
            <div className="stat-value">
              {statisticsData.userActivity.activeUsers.toLocaleString()}
            </div>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">New Users</span>
              <TrendingUp className="h-5 w-5 text-primary-500" />
            </div>
            <div className="stat-value">
              {statisticsData.userActivity.newUsers.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Over Time */}
          <div className="bg-dark-100 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-dark-300">
              <h3 className="text-lg font-semibold text-white">
                Engagement Over Time
              </h3>
            </div>
            <div className="p-4" style={{ height: "300px" }}>
              <Line data={engagementData} options={lineChartOptions} />
            </div>
          </div>

          {/* Content Distribution */}
          <div className="bg-dark-100 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-dark-300">
              <h3 className="text-lg font-semibold text-white">
                Content Distribution
              </h3>
            </div>
            <div className="p-4" style={{ height: "300px" }}>
              <Doughnut
                data={contentDistributionData}
                options={doughnutChartOptions}
              />
            </div>
          </div>

          {/* Top Performing Events */}
          <div className="bg-dark-100 rounded-lg overflow-hidden lg:col-span-2">
            <div className="p-4 border-b border-dark-300">
              <h3 className="text-lg font-semibold text-white">
                Top Performing Events
              </h3>
            </div>
            <div className="p-4" style={{ height: "300px" }}>
              <Bar data={topEventsData} options={barChartOptions} />
            </div>
          </div>
        </div>

        {/* Top Performing Content Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Events */}
          <div className="bg-dark-100 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-dark-300">
              <h3 className="text-lg font-semibold text-white">Top Events</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-dark-300">
                <thead className="bg-dark-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase">
                      Likes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase">
                      Comments
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase">
                      Views
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-300">
                  {statisticsData.topPerforming.events
                    .slice(0, 5)
                    .map((event, index) => (
                      <tr key={event._id} className="hover:bg-dark-200">
                        <td className="px-4 py-3 text-sm text-white">
                          <div className="flex items-center">
                            <span className="text-primary-500 font-bold mr-2">
                              #{index + 1}
                            </span>
                            {event.title.substring(0, 30)}...
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {event.likesCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {event.commentsCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {event.views}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Media */}
          <div className="bg-dark-100 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-dark-300">
              <h3 className="text-lg font-semibold text-white">Top Media</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-dark-300">
                <thead className="bg-dark-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase">
                      Media
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase">
                      Likes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-300">
                  {statisticsData.topPerforming.media
                    .slice(0, 5)
                    .map((media, index) => (
                      <tr key={media._id} className="hover:bg-dark-200">
                        <td className="px-4 py-3 text-sm text-white">
                          <div className="flex items-center">
                            <span className="text-primary-500 font-bold mr-2">
                              #{index + 1}
                            </span>
                            {media.name.substring(0, 20)}...
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white capitalize">
                          {media.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {media.likesCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {media.commentsCount}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Statistics;
