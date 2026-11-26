
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "./App.css";
import dashboardData from "./data/dashboardData";

const STORAGE_KEY = "cnappDashboard";
const THEME_KEY = "cnappTheme";

const COLORS = ["#4f7df3", "#20b486", "#f5a623", "#e66b72", "#8b6ce8"];

const initialData = [
  {
    id: 1,
    category: "CSPM Executive Dashboard",
    shortName: "CSPM Dashboard",
    widgets: [
      {
        id: 101,
        name: "Cloud Accounts",
        text: "2 Total Accounts",
        type: "pie",
        chartData: [
          { name: "Connected", value: 2 },
          { name: "Not Connected", value: 1 },
        ],
      },
      {
        id: 102,
        name: "Cloud Account Risk Assessment",
        text: "9,659 Total Assessments",
        type: "pie",
        chartData: [
          { name: "Healthy", value: 7200 },
          { name: "At Risk", value: 1800 },
          { name: "Critical", value: 659 },
        ],
      },
      {
        id: 103,
        name: "Security Posture Score",
        text: "Overall security posture is 87%",
        type: "bar",
        chartData: [
          { name: "AWS", value: 92 },
          { name: "Azure", value: 81 },
          { name: "GCP", value: 88 },
        ],
      },
    ],
  },
  {
    id: 2,
    category: "CWPP Dashboard",
    shortName: "CWPP Dashboard",
    widgets: [
      {
        id: 201,
        name: "Top 5 Namespace Specific Alerts",
        text: "No graph data available yet. Connect a data source to see namespace alerts.",
        type: "text",
      },
      {
        id: 202,
        name: "Workload Alerts",
        text: "No critical workload alerts are currently configured.",
        type: "text",
      },
      {
        id: 203,
        name: "Runtime Protection",
        text: "Runtime protection is enabled for 18 workloads.",
        type: "metric",
        value: "18",
        caption: "Protected workloads",
      },
    ],
  },
  {
    id: 3,
    category: "Registry Scan",
    shortName: "Registry Scan",
    widgets: [
      {
        id: 301,
        name: "Image Risk Assessment",
        text: "1,470 Total Vulnerabilities",
        type: "pie",
        chartData: [
          { name: "Low", value: 890 },
          { name: "Medium", value: 420 },
          { name: "High", value: 160 },
        ],
      },
      {
        id: 302,
        name: "Image Security Issues",
        text: "2 Total Images",
        type: "bar",
        chartData: [
          { name: "Secure", value: 1 },
          { name: "At Risk", value: 1 },
        ],
      },
      {
        id: 303,
        name: "Recent Image Scans",
        text: "12 container images scanned in the last 24 hours.",
        type: "metric",
        value: "12",
        caption: "Images scanned today",
      },
    ],
  },
];

function safeLoadDashboard() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return initialData;
    }

    const parsedData = JSON.parse(savedData);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return initialData;
    }

    return parsedData;
  } catch {
    return initialData;
  }
}

function App() {
  const [categories, setCategories] = useState(safeLoadDashboard);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || "light";
  });

  const [activeSection, setActiveSection] = useState("Overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [modal, setModal] = useState("");
  const [editing, setEditing] = useState(null);

  const [formName, setFormName] = useState("");
  const [formText, setFormText] = useState("");
  const [formCategory, setFormCategory] = useState("1");
  const [formType, setFormType] = useState("text");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [toast, setToast] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2800);

    return () => clearTimeout(timer);
  }, [toast]);

  const totalWidgets = categories.reduce(
    (total, category) => total + category.widgets.length,
    0
  );

  const totalCategories = categories.length;

  const customCount = categories.reduce(
    (total, category) =>
      total + category.widgets.filter((widget) => widget.custom).length,
    0
  );

  const criticalCount = categories.reduce(
    (total, category) =>
      total +
      category.widgets.filter((widget) =>
        /critical|high risk/i.test(
          `${widget.name} ${widget.text}`
        )
      ).length,
    0
  );

  const filteredCategories = useMemo(() => {
    return categories
      .filter((category) => {
        if (
          activeSection !== "Overview" &&
          String(category.id) !== String(activeSection)
        ) {
          return false;
        }

        return true;
      })
      .map((category) => {
        const filteredWidgets = category.widgets.filter((widget) => {
          const matchesSearch =
            widget.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (widget.text || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase());

          const matchesType =
            typeFilter === "All" ||
            (widget.type || "text") === typeFilter;

          return matchesSearch && matchesType;
        });

        return {
          ...category,
          widgets: filteredWidgets,
        };
      })
      .filter((category) => category.widgets.length > 0);
  }, [categories, activeSection, searchTerm, typeFilter]);

  function showToast(message) {
    setToast(message);
  }

  function openAddModal(categoryId = null) {
    setEditing(null);
    setFormName("");
    setFormText("");
    setFormType("text");
    setFormCategory(
      categoryId ? String(categoryId) : String(categories[0]?.id || "")
    );
    setModal("widget");
  }

  function openEditModal(category, widget) {
    setEditing({
      categoryId: category.id,
      widgetId: widget.id,
    });

    setFormName(widget.name);
    setFormText(widget.text || "");
    setFormType(widget.type || "text");
    setFormCategory(String(category.id));
    setModal("widget");
  }

  function saveWidget() {
    if (!formName.trim() || !formText.trim()) {
      showToast("Please fill in all required fields.");
      return;
    }

    const targetCategory = categories.find(
      (category) => String(category.id) === String(formCategory)
    );

    if (!targetCategory) {
      showToast("Please select a valid category.");
      return;
    }

    const duplicate = targetCategory.widgets.some((widget) => {
      const isSameWidget =
        editing &&
        String(widget.id) === String(editing.widgetId) &&
        String(targetCategory.id) === String(editing.categoryId);

      return (
        !isSameWidget &&
        widget.name.toLowerCase() === formName.trim().toLowerCase()
      );
    });

    if (duplicate) {
      showToast("A widget with this name already exists in this category.");
      return;
    }

    if (editing) {
      setCategories((previous) =>
        previous.map((category) => {
          const withoutOldWidget = category.widgets.filter(
            (widget) =>
              !(
                String(category.id) === String(editing.categoryId) &&
                String(widget.id) === String(editing.widgetId)
              )
          );

          if (String(category.id) === String(formCategory)) {
            return {
              ...category,
              widgets: [
                ...withoutOldWidget,
                {
                  ...(
                    categories
                      .find(
                        (item) =>
                          String(item.id) === String(editing.categoryId)
                      )
                      ?.widgets.find(
                        (item) =>
                          String(item.id) === String(editing.widgetId)
                      ) || {}
                  ),
                  id: editing.widgetId,
                  name: formName.trim(),
                  text: formText.trim(),
                  type: formType,
                },
              ],
            };
          }

          return {
            ...category,
            widgets: withoutOldWidget,
          };
        })
      );

      showToast("Widget updated successfully.");
    } else {
      setCategories((previous) =>
        previous.map((category) =>
          String(category.id) === String(formCategory)
            ? {
                ...category,
                widgets: [
                  ...category.widgets,
                  {
                    id: Date.now(),
                    name: formName.trim(),
                    text: formText.trim(),
                    type: formType,
                    custom: true,
                  },
                ],
              }
            : category
        )
      );

      showToast("Widget added successfully.");
    }

    setModal("");
    setEditing(null);
  }

  function removeWidget(categoryId, widgetId) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this widget?"
    );

    if (!confirmed) return;

    setCategories((previous) =>
      previous.map((category) =>
        String(category.id) === String(categoryId)
          ? {
              ...category,
              widgets: category.widgets.filter(
                (widget) => String(widget.id) !== String(widgetId)
              ),
            }
          : category
      )
    );

    showToast("Widget removed successfully.");
  }

  function addLibraryWidget(categoryId, widget) {
    const targetCategory = categories.find(
      (category) => String(category.id) === String(categoryId)
    );

    if (!targetCategory) return;

    const alreadyExists = targetCategory.widgets.some(
      (item) => item.name.toLowerCase() === widget.name.toLowerCase()
    );

    if (alreadyExists) {
      showToast("This widget is already added.");
      return;
    }

    setCategories((previous) =>
      previous.map((category) =>
        String(category.id) === String(categoryId)
          ? {
              ...category,
              widgets: [
                ...category.widgets,
                {
                  ...widget,
                  id: Date.now() + Math.floor(Math.random() * 10000),
                },
              ],
            }
          : category
      )
    );

    showToast("Widget added from library.");
  }

  function availableLibraryWidgets(categoryId) {
    const sourceCategory = dashboardData.find(
      (category) => String(category.id) === String(categoryId)
    );

    const currentCategory = categories.find(
      (category) => String(category.id) === String(categoryId)
    );

    if (!sourceCategory || !currentCategory) return [];

    return sourceCategory.widgets.filter(
      (sourceWidget) =>
        !currentCategory.widgets.some(
          (widget) =>
            widget.name.toLowerCase() === sourceWidget.name.toLowerCase()
        )
    );
  }

  function addCategory() {
    const name = newCategoryName.trim();

    if (!name) {
      showToast("Please enter a category name.");
      return;
    }

    const alreadyExists = categories.some(
      (category) =>
        category.category.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      showToast("This category already exists.");
      return;
    }

    const newCategory = {
      id: Date.now(),
      category: name,
      shortName: name,
      widgets: [],
    };

    setCategories((previous) => [...previous, newCategory]);
    setNewCategoryName("");
    setModal("");
    showToast("Category created successfully.");
  }

  function deleteCategory(categoryId) {
    const category = categories.find(
      (item) => String(item.id) === String(categoryId)
    );

    if (!category) return;

    if (Number(categoryId) <= 3) {
      showToast("Default categories cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${category.category}" and all its widgets?`
    );

    if (!confirmed) return;

    setCategories((previous) =>
      previous.filter(
        (item) => String(item.id) !== String(categoryId)
      )
    );

    setActiveSection("Overview");
    showToast("Category deleted successfully.");
  }

  function exportDashboard() {
    const backup = {
      dashboardName: "CNAPP Dashboard",
      exportedAt: new Date().toISOString(),
      totalCategories: categories.length,
      totalWidgets,
      categories,
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "cnapp-dashboard-backup.json";
    link.click();

    URL.revokeObjectURL(url);
    showToast("Dashboard exported successfully.");
  }

  function importDashboard(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(loadEvent.target.result);
        const importedCategories = Array.isArray(parsed)
          ? parsed
          : parsed.categories;

        const valid =
          Array.isArray(importedCategories) &&
          importedCategories.length > 0 &&
          importedCategories.every(
            (category) =>
              category.id !== undefined &&
              typeof category.category === "string" &&
              Array.isArray(category.widgets) &&
              category.widgets.every(
                (widget) =>
                  widget.id !== undefined &&
                  typeof widget.name === "string" &&
                  typeof widget.text === "string"
              )
          );

        if (!valid) {
          showToast("Invalid dashboard backup file.");
          return;
        }

        const confirmed = window.confirm(
          "Importing this backup will replace your current dashboard. Continue?"
        );

        if (!confirmed) return;

        const cleanedData = importedCategories.map((category) => ({
          ...category,
          shortName: category.shortName || category.category,
          widgets: category.widgets.map((widget) => ({
            ...widget,
            type: widget.type || "text",
          })),
        }));

        setCategories(cleanedData);
        setActiveSection("Overview");
        setSearchTerm("");
        setTypeFilter("All");

        showToast("Dashboard imported successfully.");
      } catch {
        showToast("Could not read this JSON file.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  function resetDashboard() {
    const confirmed = window.confirm(
      "Restore the sample dashboard? Your current dashboard changes will be replaced."
    );

    if (!confirmed) return;

    setCategories(initialData);
    setActiveSection("Overview");
    setSearchTerm("");
    setTypeFilter("All");
    setModal("");
    setSettingsOpen(false);

    showToast("Sample dashboard restored.");
  }

  function renderWidget(widget) {
    if (widget.type === "pie" || widget.type === "chart") {
      const chartData =
        widget.chartData || [
          { name: "Available", value: 65 },
          { name: "Remaining", value: 35 },
        ];

      return (
        <div className="widget-chart">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend verticalAlign="bottom" height={30} />
            </PieChart>
          </ResponsiveContainer>

          <p className="widget-description">{widget.text}</p>
        </div>
      );
    }

    if (widget.type === "bar") {
      return (
        <div className="widget-chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={
                widget.chartData || [
                  { name: "A", value: 40 },
                  { name: "B", value: 70 },
                  { name: "C", value: 55 },
                ]
              }
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#4f7df3"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <p className="widget-description">{widget.text}</p>
        </div>
      );
    }

    if (widget.type === "metric") {
      return (
        <div className="widget-metric">
          <div className="metric-number">
            {widget.value || "0"}
          </div>
          <p>{widget.caption || widget.text}</p>
          {widget.caption && (
            <span className="widget-description">{widget.text}</span>
          )}
        </div>
      );
    }

    return (
      <div className="widget-empty">
        <div className="empty-icon">▤</div>
        <p>{widget.text || "No data available."}</p>
      </div>
    );
  }

  const navigation = [
    {
      label: "Overview",
      id: "Overview",
      icon: "▦",
    },
    ...categories.map((category) => ({
      label: category.shortName || category.category,
      id: String(category.id),
      icon:
        Number(category.id) === 1
          ? "◈"
          : Number(category.id) === 2
          ? "⬡"
          : Number(category.id) === 3
          ? "▣"
          : "▤",
    })),
  ];

  return (
    <div className={`app-shell ${compactMode ? "compact-mode" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">C</div>
          <div>
            <h2>CNAPP</h2>
            <span>Cloud Security</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-heading">WORKSPACE</p>

          <nav className="sidebar-nav">
            {navigation.map((item) => (
              <button
                key={item.id}
                className={
                  activeSection === item.id ? "nav-item active" : "nav-item"
                }
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() => setSettingsOpen(true)}
          >
            <span className="nav-icon">⚙</span>
            <span>Settings</span>
          </button>

          <div className="profile-card">
            <div className="profile-avatar">JD</div>
            <div className="profile-info">
              <strong>Dashboard Admin</strong>
              <span>Administrator</span>
            </div>
            <span className="profile-status"></span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Dashboard</span>
            <span className="breadcrumb-separator">/</span>
            <strong>
              {activeSection === "Overview"
                ? "Overview"
                : categories.find(
                    (item) => String(item.id) === String(activeSection)
                  )?.category || "Dashboard"}
            </strong>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              title="Toggle theme"
              onClick={() =>
                setTheme((previous) =>
                  previous === "light" ? "dark" : "light"
                )
              }
            >
              {theme === "light" ? "☾" : "☀"}
            </button>

            <div className="notification-wrapper">
              <button
                className="icon-button notification-button"
                title="Notifications"
                onClick={() =>
                  setNotificationsOpen((previous) => !previous)
                }
              >
                ♧
                <span className="notification-dot"></span>
              </button>

              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="panel-heading">
                    <strong>Notifications</strong>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="notification-item">
                    <span className="notification-indicator blue"></span>
                    <div>
                      <strong>Dashboard ready</strong>
                      <p>Your dashboard is up to date.</p>
                    </div>
                  </div>

                  <div className="notification-item">
                    <span className="notification-indicator green"></span>
                    <div>
                      <strong>Local storage enabled</strong>
                      <p>Your changes are saved automatically.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              className="avatar-button"
              title="Admin profile"
            >
              JD
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-section">
            <div>
              <p className="eyebrow">CLOUD SECURITY MANAGEMENT</p>
              <h1>
                {activeSection === "Overview"
                  ? "CNAPP Dashboard"
                  : categories.find(
                      (item) => String(item.id) === String(activeSection)
                    )?.category || "Dashboard"}
              </h1>
              <p className="page-subtitle">
                Monitor your cloud security posture from one place.
              </p>
            </div>

            <div className="welcome-actions">
              <button
                className="secondary-button"
                onClick={exportDashboard}
              >
                ↓ Export
              </button>

              <button
                className="secondary-button"
                onClick={() => fileInputRef.current?.click()}
              >
                ↑ Import
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={importDashboard}
              />

              <button
                className="primary-button"
                onClick={() => openAddModal()}
              >
                + Add Widget
              </button>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue-bg">▦</div>
              <div>
                <span>Total Widgets</span>
                <strong>{totalWidgets}</strong>
                <small>Across all categories</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple-bg">◈</div>
              <div>
                <span>Total Categories</span>
                <strong>{totalCategories}</strong>
                <small>Security sections</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green-bg">✦</div>
              <div>
                <span>Custom Widgets</span>
                <strong>{customCount}</strong>
                <small>Created by you</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange-bg">!</div>
              <div>
                <span>Risk Indicators</span>
                <strong>{criticalCount}</strong>
                <small>Based on widget labels</small>
              </div>
            </div>
          </section>

          <section className="dashboard-toolbar">
            <div className="toolbar-left">
              <div className="search-box">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Search widgets..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")}>
                    ×
                  </button>
                )}
              </div>

              <select
                className="filter-select"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="All">All widget types</option>
                <option value="text">Text</option>
                <option value="metric">Metric</option>
                <option value="pie">Pie Chart</option>
                <option value="chart">Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>

            <div className="toolbar-right">
              <button
                className="secondary-button"
                onClick={() => setCompactMode((previous) => !previous)}
              >
                {compactMode ? "Comfortable View" : "Compact View"}
              </button>

              <button
                className="secondary-button"
                onClick={() => setModal("category")}
              >
                + Add Category
              </button>
            </div>
          </section>

          {filteredCategories.length === 0 ? (
            <div className="no-results">
              <div className="empty-icon">⌕</div>
              <h3>No widgets found</h3>
              <p>
                Try another search or change the selected widget filter.
              </p>
              <button
                className="secondary-button"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("All");
                  setActiveSection("Overview");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <section className="category-list">
              {filteredCategories.map((category) => (
                <div className="category-section" key={category.id}>
                  <div className="category-header">
                    <div className="category-title">
                      <div className="category-symbol">◈</div>
                      <div>
                        <h2>{category.category}</h2>
                        <span>
                          {category.widgets.length} widget
                          {category.widgets.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="category-actions">
                      <button
                        className="text-button"
                        onClick={() => openAddModal(category.id)}
                      >
                        + Add Widget
                      </button>

                      <button
                        className="text-button"
                        onClick={() => {
                          const available = availableLibraryWidgets(
                            category.id
                          );

                          if (available.length === 0) {
                            showToast("No additional library widgets available.");
                            return;
                          }

                          setModal(`library-${category.id}`);
                        }}
                      >
                        Widget Library
                      </button>

                      {Number(category.id) > 3 && (
                        <button
                          className="delete-category-button"
                          onClick={() => deleteCategory(category.id)}
                          title="Delete category"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="widget-grid">
                    {category.widgets.map((widget) => (
                      <article className="widget-card" key={widget.id}>
                        <div className="widget-header">
                          <div>
                            <h3>{widget.name}</h3>
                            <span className="widget-type">
                              {(widget.type || "text").toUpperCase()}
                            </span>
                          </div>

                          <div className="widget-menu">
                            <button
                              title="Edit widget"
                              onClick={() =>
                                openEditModal(category, widget)
                              }
                            >
                              ✎
                            </button>

                            <button
                              title="Remove widget"
                              onClick={() =>
                                removeWidget(category.id, widget.id)
                              }
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="widget-body">
                          {renderWidget(widget)}
                        </div>

                        {widget.custom && (
                          <div className="custom-label">
                            Custom Widget
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          <footer className="dashboard-footer">
            <span>CNAPP Cloud Security Dashboard</span>
            <span>Changes are saved automatically</span>
          </footer>
        </div>
      </main>

      {modal === "widget" && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setModal("");
            }
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>{editing ? "Edit Widget" : "Add New Widget"}</h2>
                <p>
                  {editing
                    ? "Update your widget details."
                    : "Create a widget for your dashboard."}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setModal("")}
              >
                ×
              </button>
            </div>

            <div className="modal-form">
              <label>Widget Name</label>
              <input
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder="Enter widget name"
              />

              <label>Description / Content</label>
              <textarea
                value={formText}
                onChange={(event) => setFormText(event.target.value)}
                placeholder="Enter widget description"
                rows={4}
              />

              <label>Category</label>
              <select
                value={formCategory}
                onChange={(event) => setFormCategory(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.category}
                  </option>
                ))}
              </select>

              <label>Widget Type</label>
              <select
                value={formType}
                onChange={(event) => setFormType(event.target.value)}
              >
                <option value="text">Text Widget</option>
                <option value="metric">Metric Widget</option>
                <option value="pie">Pie Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setModal("")}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={saveWidget}
              >
                {editing ? "Save Changes" : "Add Widget"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "category" && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>Create Category</h2>
                <p>Add a new section to your dashboard.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setModal("")}
              >
                ×
              </button>
            </div>

            <div className="modal-form">
              <label>Category Name</label>
              <input
                value={newCategoryName}
                onChange={(event) =>
                  setNewCategoryName(event.target.value)
                }
                placeholder="Enter category name"
                onKeyDown={(event) => {
                  if (event.key === "Enter") addCategory();
                }}
              />
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setModal("")}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={addCategory}
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.startsWith("library-") && (
        <div className="modal-overlay">
          <div className="modal-card library-modal">
            <div className="modal-header">
              <div>
                <h2>Widget Library</h2>
                <p>Select a widget to add to this category.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setModal("")}
              >
                ×
              </button>
            </div>

            <div className="library-list">
              {availableLibraryWidgets(
                modal.replace("library-", "")
              ).map((widget) => (
                <div className="library-item" key={widget.id}>
                  <div>
                    <strong>{widget.name}</strong>
                    <p>{widget.text}</p>
                    <span>{(widget.type || "text").toUpperCase()}</span>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      addLibraryWidget(
                        modal.replace("library-", ""),
                        widget
                      );
                      setModal("");
                    }}
                  >
                    + Add
                  </button>
                </div>
              ))}

              {availableLibraryWidgets(
                modal.replace("library-", "")
              ).length === 0 && (
                <p className="empty-library">
                  All available widgets have already been added.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>Dashboard Settings</h2>
                <p>Manage your dashboard preferences.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setSettingsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="settings-list">
              <div className="setting-row">
                <div>
                  <strong>Dark Mode</strong>
                  <p>Change the dashboard appearance.</p>
                </div>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setTheme((previous) =>
                      previous === "light" ? "dark" : "light"
                    )
                  }
                >
                  {theme === "light" ? "Enable" : "Disable"}
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Compact Mode</strong>
                  <p>Reduce spacing between dashboard widgets.</p>
                </div>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setCompactMode((previous) => !previous)
                  }
                >
                  {compactMode ? "Disable" : "Enable"}
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Export Backup</strong>
                  <p>Download your dashboard as a JSON file.</p>
                </div>

                <button
                  className="secondary-button"
                  onClick={exportDashboard}
                >
                  Export
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Restore Sample Dashboard</strong>
                  <p>Replace current data with the sample dashboard.</p>
                </div>

                <button
                  className="danger-button"
                  onClick={resetDashboard}
                >
                  Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-message">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
