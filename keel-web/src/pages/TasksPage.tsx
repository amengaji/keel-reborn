// keel-web/src/pages/TasksPage.tsx

import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Upload,
  ChevronRight,
  AlertTriangle,
  Trash2,
  Plus,
  Edit,
  Copy,
  Search,
  Lock,
  Globe,
  Building,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ImportTaskModal from "../components/trb/ImportTaskModal";
import TaskFormModal from "../components/trb/TaskFormModal";
import { createTask, getAllTasks, updateTask, deleteSingleTask, deleteAllTasks} from "../services/taskService";

const STCW_MAP: Record<string, string> = {
  "1": "Navigation",
  "2": "Cargo Handling & Stowage",
  "3": "Ship Operations & Care",
  "4": "Marine Engineering",
  "5": "Electrical & Control",
  "6": "Maintenance & Repair",
  "7": "Radio Communications",
};

type SyllabusFunc = {
  id: string; // e.g. "FUNC-1"
  topics?: Array<{
    id: string;
    title: string;
    tasks: any[];
  }>;
};

type IndexedTask = {
  funcId: string;
  funcLabel: string;
  topicId: string;
  topicTitle: string;
  task: any;
  haystack: string; // normalized searchable string
};

type SearchScope = "current" | "all";

/**
 * TasksPage Component
 * - Search is "global across data fields"
 * - Option A implemented: Scope toggle (Current Function / All Functions)
 */
const TasksPage: React.FC = () => {
  // --- ROLE & DEPARTMENT IDENTIFICATION ---
  const userJson = localStorage.getItem("keel_user");
  const user = userJson ? JSON.parse(userJson) : null;

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isCTO =
    user?.role === "CTO" || user?.role === "ADMIN" || user?.role === "MANAGER";
  const isVesselUser =
    user?.role === "MASTER" || user?.role === "CHIEF_ENGINEER"; // Only viewers

  const userDept = user?.department || "Deck";
  const BRAND_COLOR = "#3194A0";

  const [syllabus, setSyllabus] = useState<SyllabusFunc[]>([]);
  const [activeFunction, setActiveFunction] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // SEARCH STATES
  const [taskSearch, setTaskSearch] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("current"); // ✅ OPTION A
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // MODAL STATES
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const normalize = (v: any) =>
    String(v ?? "")
      .toLowerCase()
      .trim();

  const getFunctionLabel = (funcId: string) => {
    const num = funcId.replace("FUNC-", "");
    const name = STCW_MAP[num] || "General";
    return `Function ${num}: ${name}`;
  };

  // --- 1. LOAD DATA ---
  const loadData = async () => {
    try {
      const res = await getAllTasks(); 
      
      // DEPT FILTERING (For Vessel Users)
      let processedData = res as SyllabusFunc[];
      if (isVesselUser) {
        processedData = (res as SyllabusFunc[])
          .map((func: any) => ({
            ...func,
            topics: func.topics
              ?.map((topic: any) => ({
                ...topic,
                tasks: topic.tasks?.filter(
                  (task: any) => task.dept === userDept,
                ),
              }))
              .filter((topic: any) => topic.tasks?.length > 0),
          }))
          .filter((func: any) => func.topics?.length > 0);
      }

      setSyllabus(processedData);

      if (processedData.length > 0 && !activeFunction) {
        setActiveFunction(processedData[0].id);
        if (processedData[0].topics) {
          const initialTopics = new Set(
            processedData[0].topics.map((t: any) => t.id),
          );
          setExpandedTopics(initialTopics as Set<string>);
        }
      }
    } catch (error) {
      console.error("Failed to load syllabus", error);
      toast.error("Could not load Master Task List.");
    }
  };

  const toggleTopic = (topicId: string) => {
    const newSet = new Set(expandedTopics);
    newSet.has(topicId) ? newSet.delete(topicId) : newSet.add(topicId);
    setExpandedTopics(newSet);
  };

  // Build a global search index (flattened)
  const indexedTasks = useMemo<IndexedTask[]>(() => {
    const out: IndexedTask[] = [];

    for (const func of syllabus) {
      const funcId = func.id;
      const funcLabel = getFunctionLabel(funcId);

      for (const topic of func.topics || []) {
        for (const task of topic.tasks || []) {
          // include "anything from data" in haystack
          const haystack = normalize(
            [
              funcId,
              funcLabel,
              topic.title,
              task?.title,
              task?.description,
              task?.instructions,
              task?.stcw,
              task?.code,
              task?.dept,
              task?.department,
              task?.section,
              task?.category,
              task?.safety,
              task?.safety_level,
              task?.frequency,
              task?.mandatory,
              task?.trainee_type,
              task?.evidence_type,
              task?.verification_method,
              task?.is_global ? "global" : "company",
              task?.company_id,
            ].join(" | "),
          );

          out.push({
            funcId,
            funcLabel,
            topicId: topic.id,
            topicTitle: topic.title,
            task,
            haystack,
          });
        }
      }
    }

    return out;
  }, [syllabus]);

  const searchQuery = normalize(taskSearch);
  const hasSearch = searchQuery.length > 0;

  // ✅ OPTION A: apply search scope
  const scopedIndexedTasks = useMemo(() => {
    if (searchScope === "all") return indexedTasks;
    if (!activeFunction) return indexedTasks; // no function selected -> fallback to all
    return indexedTasks.filter((row) => row.funcId === activeFunction);
  }, [indexedTasks, searchScope, activeFunction]);

  // Suggestions derived from current data (now respects scope too)
  const suggestions = useMemo(() => {
    const q = normalize(taskSearch);
    if (!q) return [];

    const pool = new Set<string>();

    for (const row of scopedIndexedTasks) {
      if (row.funcLabel) pool.add(row.funcLabel);
      if (row.topicTitle) pool.add(row.topicTitle);
      if (row.task?.title) pool.add(String(row.task.title));
      if (row.task?.stcw) pool.add(String(row.task.stcw));
      if (row.task?.dept) pool.add(String(row.task.dept));
      if (row.task?.section) pool.add(String(row.task.section));
    }

    const all = Array.from(pool);

    const starts = all.filter((s) => normalize(s).startsWith(q));
    const includes = all.filter(
      (s) => !normalize(s).startsWith(q) && normalize(s).includes(q),
    );

    return [...starts, ...includes].slice(0, 8);
  }, [taskSearch, scopedIndexedTasks]);

  const searchResults = useMemo(() => {
    if (!hasSearch) return [];
    return scopedIndexedTasks.filter((row) =>
      row.haystack.includes(searchQuery),
    );
  }, [hasSearch, scopedIndexedTasks, searchQuery]);

  // Grouped results: only needed for "all" scope
  const groupedSearchResults = useMemo(() => {
    if (!hasSearch) return [];
    if (searchScope !== "all") return [];

    const funcMap = new Map<
      string,
      {
        funcId: string;
        funcLabel: string;
        topics: Map<
          string,
          { topicId: string; topicTitle: string; tasks: any[] }
        >;
      }
    >();

    for (const row of searchResults) {
      if (!funcMap.has(row.funcId)) {
        funcMap.set(row.funcId, {
          funcId: row.funcId,
          funcLabel: row.funcLabel,
          topics: new Map(),
        });
      }

      const funcEntry = funcMap.get(row.funcId)!;

      if (!funcEntry.topics.has(row.topicId)) {
        funcEntry.topics.set(row.topicId, {
          topicId: row.topicId,
          topicTitle: row.topicTitle,
          tasks: [],
        });
      }

      funcEntry.topics.get(row.topicId)!.tasks.push(row.task);
    }

    return Array.from(funcMap.values()).map((f) => ({
      funcId: f.funcId,
      funcLabel: f.funcLabel,
      topics: Array.from(f.topics.values()),
    }));
  }, [hasSearch, searchResults, searchScope]);

  // Current-function results are already scoped, but we still group by topic for clean rendering
  const groupedCurrentFunctionResults = useMemo(() => {
    if (!hasSearch) return [];
    if (searchScope !== "current") return [];

    const topicMap = new Map<
      string,
      { topicId: string; topicTitle: string; tasks: any[] }
    >();

    for (const row of searchResults) {
      if (!topicMap.has(row.topicId)) {
        topicMap.set(row.topicId, {
          topicId: row.topicId,
          topicTitle: row.topicTitle,
          tasks: [],
        });
      }
      topicMap.get(row.topicId)!.tasks.push(row.task);
    }

    return Array.from(topicMap.values());
  }, [hasSearch, searchResults, searchScope]);

  // --- 2. ACTIONS ---
  const handleImport = async (flatData: any[]) => {
    try {
      let count = 0;
      for (const item of flatData) {
        await createTask({
          code: item.stcw_reference,
          title: item.title,
          description: item.description,
          instructions: item.instructions,
          stcw: item.stcw || null,
          department: item.department || "Deck",
          section: item.category || "General",
          partNum: item.function_code || "1",
          trainee_type: item.trainee_type,
          safety_level: item.safety_level,
          frequency: item.frequency,
          mandatory: item.mandatory,
          evidence_type: item.evidence_type,
          verification_method: item.verification_method,
        });
        count++;
      }
      toast.success(`Imported ${count} tasks successfully.`);
      loadData();
      setIsImportOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Import failed.");
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm("⚠️ This will permanently delete ALL TRB tasks. Proceed?")
    )
      return;
    try {
      await deleteAllTasks();
      toast.success("All tasks deleted successfully.");
      setSyllabus([]);
      setActiveFunction(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete all tasks.");
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteSingleTask(taskId);
      toast.info("Task removed.");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task.");
    }
  };

  const cloneTask = async (funcId: string, task: any) => {
    try {
      await createTask({
        code: `${task.code}-COPY-${Math.floor(Math.random() * 1000)}`,
        title: `${task.title} (Copy)`,
        department: task.dept,
        safety_level: task.safety,
        partNum: funcId.replace("FUNC-", ""),
        section: task.section,
      });
      toast.success("Task duplicated.");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate task.");
    }
  };

  const handleSaveTask = async (formData: any) => {
    try {
      if (formData.id) {
        await updateTask(formData.id, formData);
        toast.success("Task updated.");
      } else {
        await createTask(formData);
        toast.success("New task created.");
      }

      setIsTaskFormOpen(false);
      setEditingTask(null);
      await loadData();

      if (formData.partNum) {
        setActiveFunction(`FUNC-${formData.partNum}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Operation failed.");
    }
  };

  const openEdit = (task: any, funcId: string, sectionTitle: string) => {
    setEditingTask({
      id: task.id,
      function_code: task.function_code,
      category: sectionTitle,
      stcw: task.stcw || "",
      title: task.title,
      description: task.description || "",
      instructions: task.instructions || "",
      department: task.dept || "Deck",
      trainee_type: task.trainee_type || "DECK_CADET",
      safety_level: task.safety || "None",
      frequency: task.frequency || "ONCE",
      mandatory: task.mandatory ?? true,
      evidence_type: task.evidence_type || "DOCUMENT/PHOTO",
      verification_method: task.verification_method || "OBSERVATION",
    });
    setIsTaskFormOpen(true);
  };

  const jumpToTaskLocation = (funcId: string, topicId: string) => {
    setActiveFunction(funcId);
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      next.add(topicId);
      return next;
    });

    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const applySuggestion = (value: string) => {
    setTaskSearch(value);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    searchInputRef.current?.focus();
  };

  const onSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      if (
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < suggestions.length
      ) {
        e.preventDefault();
        applySuggestion(suggestions[activeSuggestionIndex]);
      }
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const renderTaskCard = (
    task: any,
    funcIdForActions: string,
    topicTitleForEdit: string,
  ) => {
    const isGlobal = task.is_global;
    const isOwner = task.company_id === user?.companyId;
    if(task.company_id){
      console.log("hii")
    }
    const canEdit = isSuperAdmin || (isOwner);

    return (
      <div
        key={task.id}
        className={`group bg-background border border-border p-4 rounded-lg hover:border-primary/40 transition-all relative ${
          !isGlobal ? "border-l-4 border-l-green-500" : ""
        }`}
      >
        <div className="flex justify-between items-start pr-20">
          <div className="flex items-center gap-2">
            {isGlobal ? (
              <div
                className="bg-blue-500/10 text-blue-600 p-1 rounded border border-blue-500/20"
                title="Global Standard Task"
              >
                <Globe size={12} />
              </div>
            ) : (
              <div
                className="bg-green-500/10 text-green-600 p-1 rounded border border-green-500/20"
                title="Company Custom Task"
              >
                <Building size={12} />
              </div>
            )}
            <h4 className="font-medium text-sm text-foreground">
              {task.title}
            </h4>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 pl-7">
          {task.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-3 items-center pl-7">
          <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
            {task.stcw || "NO STCW REF"}
          </span>
          {task.dept && (
            <span className="text-[10px] border border-border px-2 py-0.5 rounded text-muted-foreground">
              {task.dept}
            </span>
          )}
          {task.safety && task.safety !== "Green" && (
            <span className="text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
              <AlertTriangle size={10} /> {task.safety}
            </span>
          )}
        </div>

        {!isVesselUser && (
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-md shadow-sm p-1">
            {canEdit ? (
              <>
                <button
                  onClick={() => cloneTask(funcIdForActions, task)}
                  className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 rounded"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <div className="w-px h-3 bg-border mx-0.5"></div>
                <button
                  onClick={() =>
                    openEdit(task, funcIdForActions, topicTitleForEdit)
                  }
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <div className="w-px h-3 bg-border mx-0.5"></div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground bg-muted rounded cursor-not-allowed">
                <Lock size={12} />
                <span className="text-[10px] font-bold">LOCKED</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-foreground">TRB Syllabus</h1>
          <p className="text-muted-foreground text-sm">
            {isVesselUser
              ? `Viewing Master Task List for ${userDept} department.`
              : "Manage Master Task List (STCW Compliant)."}
          </p>
        </div>

        {!isVesselUser && (
          <div className="flex gap-2">
            {syllabus.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 px-3 py-2 rounded-lg transition-all"
                title="Clear All"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={() => setIsImportOpen(true)}
              className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
            >
              <Upload size={18} />
              <span>Import</span>
            </button>
            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskFormOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} />
              <span>Add Task</span>
            </button>
          </div>
        )}
      </div>

      {syllabus.length === 0 ? (
        <div className="flex-1 bg-card border border-border rounded-xl flex flex-col items-center justify-center text-center p-8 border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Syllabus Not Defined
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {isVesselUser
              ? "The TRB syllabus has not been populated by an administrator yet."
              : "Import from Excel or create your first task to begin."}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* LEFT: SIDEBAR (STCW FUNCTIONS) */}
          <div className="w-1/3 max-xs bg-card border border-border rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 bg-muted/30 border-b border-border font-bold text-xs text-muted-foreground uppercase flex items-center gap-2">
              <BookOpen size={14} /> STCW Functions
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {syllabus.map((func) => (
                <button
                  key={func.id}
                  onClick={() => setActiveFunction(func.id)}
                  style={{
                    borderColor: activeFunction === func.id ? BRAND_COLOR : "",
                    backgroundColor:
                      activeFunction === func.id ? `${BRAND_COLOR}10` : "",
                    color: activeFunction === func.id ? BRAND_COLOR : "",
                  }}
                  className={`w-full text-left p-3 rounded-lg text-sm font-medium flex justify-between items-center transition-all ${
                    activeFunction === func.id
                      ? "shadow-sm border"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="truncate">{getFunctionLabel(func.id)}</span>
                  {activeFunction === func.id && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: CONTENT */}
          <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-3 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Label - Keep it subtle */}
              <div className="hidden lg:flex items-center gap-2 font-semibold text-[10px] tracking-wider text-muted-foreground/70 uppercase">
                <Search size={12} className="opacity-70" />
                <span>Find Tasks</span>
              </div>

              <div className="flex flex-1 items-center gap-3 w-full sm:w-auto max-w-3xl">
                {/* ✅ Modern Segmented Control Toggle */}
                <div className="relative flex p-1 bg-muted rounded-lg border border-border/50 select-none">
                  <button
                    type="button"
                    onClick={() => setSearchScope("current")}
                    title="Search within the selected STCW function only"
                    className={`relative z-10 px-4 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                      searchScope === "current"
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    This Function
                    {searchScope === "current" && (
                      <div className="absolute inset-0 bg-primary rounded-md -z-10 shadow-sm" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSearchScope("all")}
                    title="Search across all STCW functions"
                    className={`relative z-10 px-4 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                      searchScope === "all"
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All Functions
                    {searchScope === "all" && (
                      <div className="absolute inset-0 bg-primary rounded-md -z-10 shadow-sm" />
                    )}
                  </button>
                </div>

                {/* Search Input Container */}
                <div className="relative flex-1 group" ref={searchWrapRef}>
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors"
                    size={14}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={
                      searchScope === "current"
                        ? "Filter function tasks..."
                        : "Search global database..."
                    }
                    value={taskSearch}
                    onChange={(e) => {
                      setTaskSearch(e.target.value);
                      setShowSuggestions(true);
                      setActiveSuggestionIndex(-1);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onKeyDown={onSearchKeyDown}
                    className="w-full bg-background pl-9 pr-9 py-2 rounded-lg border border-border text-sm shadow-sm placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />

                  {/* Clear Button inside the input for a cleaner look */}
                  {hasSearch && (
                    <button
                      onClick={() => {
                        setTaskSearch("");
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground/60 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}

                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {suggestions.map((s, idx) => (
                        <button
                          key={`${s}-${idx}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applySuggestion(s)}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/50 last:border-0 ${
                            idx === activeSuggestionIndex
                              ? "bg-accent text-accent-foreground"
                              : ""
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* SEARCH MODE */}
              {hasSearch ? (
                searchResults.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm font-medium text-foreground">
                      No results found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try searching by STCW ref, department, safety level, topic
                      name, or function name.
                    </p>
                  </div>
                ) : searchScope === "all" ? (
                  // All Functions: grouped by function -> topic
                  groupedSearchResults.map((funcGroup) => (
                    <div key={funcGroup.funcId} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setActiveFunction(funcGroup.funcId)}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {funcGroup.funcLabel}
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {funcGroup.topics.reduce(
                            (acc: number, t: any) =>
                              acc + (t.tasks?.length || 0),
                            0,
                          )}{" "}
                          matches
                        </span>
                      </div>

                      {funcGroup.topics.map((topic: any) => (
                        <div
                          key={topic.topicId}
                          className="border border-border rounded-lg overflow-hidden bg-background shadow-sm animate-in fade-in slide-in-from-bottom-2"
                        >
                          <button
                            onClick={() =>
                              jumpToTaskLocation(
                                funcGroup.funcId,
                                topic.topicId,
                              )
                            }
                            className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="p-1 rounded-full text-muted-foreground"
                                style={{ backgroundColor: "transparent" }}
                              >
                                <ChevronRight size={16} />
                              </div>
                              <h3 className="font-bold text-foreground text-sm">
                                {topic.topicTitle}
                              </h3>
                              <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                                {topic.tasks.length} matches
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              Jump
                            </span>
                          </button>

                          <div className="p-4 space-y-3">
                            {topic.tasks.map((task: any) =>
                              renderTaskCard(
                                task,
                                funcGroup.funcId,
                                topic.topicTitle,
                              ),
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  // Current Function: grouped by topic only (since results are scoped)
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-foreground">
                        {activeFunction
                          ? getFunctionLabel(activeFunction)
                          : "Current Function"}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {searchResults.length} matches
                      </span>
                    </div>

                    {groupedCurrentFunctionResults.map((topic) => (
                      <div
                        key={topic.topicId}
                        className="border border-border rounded-lg overflow-hidden bg-background shadow-sm animate-in fade-in slide-in-from-bottom-2"
                      >
                        <button
                          onClick={() => {
                            if (activeFunction)
                              jumpToTaskLocation(activeFunction, topic.topicId);
                          }}
                          className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="p-1 rounded-full text-muted-foreground"
                              style={{ backgroundColor: "transparent" }}
                            >
                              <ChevronRight size={16} />
                            </div>
                            <h3 className="font-bold text-foreground text-sm">
                              {topic.topicTitle}
                            </h3>
                            <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                              {topic.tasks.length} matches
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            Jump
                          </span>
                        </button>

                        <div className="p-4 space-y-3">
                          {topic.tasks.map((task) =>
                            renderTaskCard(
                              task,
                              activeFunction || "FUNC-1",
                              topic.topicTitle,
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // NORMAL MODE (no search): show current active function with expandable topics
                syllabus
                  .filter((f: any) => f.id === activeFunction)
                  .map((func: any) => (
                    <div key={func.id}>
                      {func.topics?.map((topic: any) => {
                        const isExpanded = expandedTopics.has(topic.id);

                        return (
                          <div
                            key={topic.id}
                            className="border border-border rounded-lg overflow-hidden bg-background mb-4 shadow-sm animate-in fade-in slide-in-from-bottom-2"
                          >
                            <button
                              onClick={() => toggleTopic(topic.id)}
                              className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-1 rounded-full transition-transform duration-200 ${
                                    isExpanded
                                      ? "rotate-90 text-white"
                                      : "text-muted-foreground"
                                  }`}
                                  style={{
                                    backgroundColor: isExpanded
                                      ? BRAND_COLOR
                                      : "transparent",
                                  }}
                                >
                                  <ChevronRight size={16} />
                                </div>
                                <h3 className="font-bold text-foreground text-sm">
                                  {topic.title}
                                </h3>
                                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                                  {topic.tasks?.length || 0} Tasks
                                </span>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-4 space-y-3">
                                {topic.tasks?.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic text-center py-2">
                                    No tasks found.
                                  </p>
                                ) : (
                                  topic.tasks.map((task: any) =>
                                    renderTaskCard(task, func.id, topic.title),
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {!isVesselUser && (
        <>
          <ImportTaskModal
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            onImport={handleImport}
          />
          <TaskFormModal
            isOpen={isTaskFormOpen}
            onClose={() => setIsTaskFormOpen(false)}
            onSave={handleSaveTask}
            editData={editingTask}
          />
        </>
      )}
    </div>
  );
};

export default TasksPage;