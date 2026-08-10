/** Redux slice for workflows state */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Workflow } from '../../types/workflow';
import { getAllWorkflows, getWorkflowDetail } from '../../services/workflow-api';

export interface WorkflowsState {
  list: Workflow[];
  activeWorkflow: Workflow | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkflowsState = {
  list: [],
  activeWorkflow: null,
  loading: false,
  error: null,
};

export const fetchWorkflows = createAsyncThunk('workflows/fetchAll', async () => {
  return await getAllWorkflows();
});

export const fetchWorkflowDetail = createAsyncThunk(
  'workflows/fetchDetail',
  async (workflowId: string) => {
    return await getWorkflowDetail(workflowId);
  }
);

const workflowsSlice = createSlice({
  name: 'workflows',
  initialState,
  reducers: {
    updateWorkflowFromSSE(state, action: PayloadAction<Partial<Workflow> & { id: string }>) {
      const { id, ...updates } = action.payload;

      // Update in list
      const listIndex = state.list.findIndex((w) => w.id === id);
      if (listIndex !== -1) {
        state.list[listIndex] = { ...state.list[listIndex], ...updates };
      }

      // Update active workflow if it matches
      if (state.activeWorkflow?.id === id) {
        state.activeWorkflow = { ...state.activeWorkflow, ...updates };
      }
    },
    clearActiveWorkflow(state) {
      state.activeWorkflow = null;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchWorkflows
      .addCase(fetchWorkflows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch workflows';
      })
      // fetchWorkflowDetail
      .addCase(fetchWorkflowDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkflowDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.activeWorkflow = action.payload;
      })
      .addCase(fetchWorkflowDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch workflow detail';
      });
  },
});

export const { updateWorkflowFromSSE, clearActiveWorkflow, setError } = workflowsSlice.actions;

export function selectAllWorkflows(state: { workflows: WorkflowsState }) {
  return state.workflows.list;
}

export function selectActiveWorkflow(state: { workflows: WorkflowsState }) {
  return state.workflows.activeWorkflow;
}

export function selectWorkflowsLoading(state: { workflows: WorkflowsState }) {
  return state.workflows.loading;
}

export function selectWorkflowsError(state: { workflows: WorkflowsState }) {
  return state.workflows.error;
}

export default workflowsSlice.reducer;
