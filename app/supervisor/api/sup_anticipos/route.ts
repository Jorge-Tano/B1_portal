// app/api/sup_anticipos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface User {
  id: number;
  employeeid: string;
  name: string;
}

interface Advance {
  id: number;
  employeeid: string;
  amount: number;
  request_date: string;
  status: string;
  amount_id?: number;
}

// GET - Get pending advances
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'pending' or 'statistics'
    const filter = searchParams.get('filter'); // Filter parameter
    
    // Get logged in user information
    const userResult = await query(
      'SELECT id, employeeid, name FROM users WHERE email = $1 OR employeeid = $2',
      [session.user.email, session.user.adUser?.employeeID]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userResult.rows[0] as User;
    
    // If requesting statistics
    if (type === 'statistics') {
      return await getStatistics(user);
    }
    
    // Get advances with filters
    return await getAdvances(filter);
    
  } catch (error: any) {
    console.error('Error GET sup_anticipos:', error.message);
    return NextResponse.json(
      { error: 'Error fetching advances' },
      { status: 500 }
    );
  }
}

// Helper function to get advances
async function getAdvances(filter?: string | null) {
  try {
    let querySQL = `
      SELECT 
        a.id,
        a.employeeid,
        COALESCE(amt.amount_value, a.amount) as amount,
        a.request_date,
        a.status,
        a.amount_id,
        u.name as user_name,
        u.employeeid as user_employeeid,
        u.department
      FROM advances a
      LEFT JOIN users u ON a.employeeid = u.employeeid
      LEFT JOIN amounts amt ON a.amount_id = amt.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Apply filters
    if (filter) {
      if (filter === 'pending') {
        querySQL += ` AND a.status = 'Pending'`;
      } else if (filter === 'approved') {
        querySQL += ` AND a.status = 'Approved'`;
      } else if (filter === 'rejected') {
        querySQL += ` AND a.status = 'Rejected'`;
      } else if (filter === 'all') {
        // Show all
      }
    } else {
      // Default: show pending advances
      querySQL += ` AND a.status = 'Pending'`;
    }
    
    querySQL += ` ORDER BY a.request_date ASC`;
    
    const result = await query(querySQL, params);
    
    console.log('Advances found:', result.rows.length);
    
    return NextResponse.json(result.rows);
    
  } catch (error: any) {
    console.error('Error fetching advances:', error.message);
    return NextResponse.json(
      { error: 'Error fetching advances' },
      { status: 500 }
    );
  }
}

// Helper function to get statistics
async function getStatistics(user: User) {
  try {
    // Get general statistics
    const statisticsResult = await query(
      `SELECT 
        COUNT(*) as total_advances,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM advances`
    );
    
    // Get this month's statistics
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const monthlyStatsResult = await query(
      `SELECT 
        COUNT(*) as total_month,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_month,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_month,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_month,
        COALESCE(SUM(
          CASE 
            WHEN amount_id IS NOT NULL THEN (SELECT amount_value FROM amounts WHERE id = advances.amount_id)
            ELSE amount 
          END
        ), 0) as total_amount_month
      FROM advances
      WHERE EXTRACT(MONTH FROM request_date) = $1
        AND EXTRACT(YEAR FROM request_date) = $2`,
      [currentMonth, currentYear]
    );
    
    return NextResponse.json({
      general: statisticsResult.rows[0],
      current_month: monthlyStatsResult.rows[0],
      user: {
        name: user.name,
        employeeid: user.employeeid
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching statistics:', error.message);
    return NextResponse.json(
      { error: 'Error fetching statistics' },
      { status: 500 }
    );
  }
}

// PUT - Approve or reject advance
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // 'approve' or 'reject'
    
    if (!id) {
      return NextResponse.json(
        { error: 'Advance ID required' },
        { status: 400 }
      );
    }
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    // Get logged in user information
    const userResult = await query(
      'SELECT id, employeeid, name FROM users WHERE email = $1 OR employeeid = $2',
      [session.user.email, session.user.adUser?.employeeID]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userResult.rows[0] as User;
    
    // Verify advance exists
    const advanceCheck = await query(
      `SELECT 
        a.*,
        COALESCE(amt.amount_value, a.amount) as amount_value
      FROM advances a
      LEFT JOIN amounts amt ON a.amount_id = amt.id
      WHERE a.id = $1`,
      [id]
    );
    
    if (advanceCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Advance not found' },
        { status: 404 }
      );
    }
    
    const advance = advanceCheck.rows[0] as Advance;
    
    // Verify advance is pending
    if (advance.status !== 'Pending') {
      return NextResponse.json(
        { error: `Advance is already ${advance.status.toLowerCase()}` },
        { status: 400 }
      );
    }
    
    let newStatus = '';
    let message = '';
    
    if (action === 'approve') {
      newStatus = 'Approved';
      message = 'Advance approved successfully';
    } else {
      newStatus = 'Rejected';
      message = 'Advance rejected successfully';
    }
    
    // Update advance status
    const result = await query(
      `UPDATE advances 
       SET status = $1
       WHERE id = $2 
       RETURNING *`,
      [newStatus, id]
    );
    
    return NextResponse.json({
      ...result.rows[0],
      message: message,
      approved_by: user.name,
      status: newStatus
    });
    
  } catch (error: any) {
    console.error('Error PUT sup_anticipos:', error.message);
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
}

// POST - Get advance report with filters
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get logged in user information
    const userResult = await query(
      'SELECT id, employeeid, name FROM users WHERE email = $1 OR employeeid = $2',
      [session.user.email, session.user.adUser?.employeeID]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userResult.rows[0] as User;
    
    const body = await request.json();
    const { filter, start_date, end_date, status } = body;
    
    // Build dynamic query based on filters
    let querySQL = `
      SELECT 
        a.id,
        a.employeeid,
        COALESCE(amt.amount_value, a.amount) as amount,
        a.request_date,
        a.status,
        a.amount_id,
        u.name as user_name,
        u.employeeid as user_employeeid,
        u.department
      FROM advances a
      LEFT JOIN users u ON a.employeeid = u.employeeid
      LEFT JOIN amounts amt ON a.amount_id = amt.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // Apply status filter
    if (status) {
      querySQL += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else if (filter === 'approved') {
      querySQL += ` AND a.status = 'Approved'`;
    } else if (filter === 'rejected') {
      querySQL += ` AND a.status = 'Rejected'`;
    } else if (filter === 'pending') {
      querySQL += ` AND a.status = 'Pending'`;
    }
    
    // Apply date filters
    if (start_date) {
      querySQL += ` AND a.request_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      querySQL += ` AND a.request_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    querySQL += ` ORDER BY a.request_date DESC`;
    
    const result = await query(querySQL, params);
    
    return NextResponse.json({
      advances: result.rows,
      total: result.rows.length,
      filters_applied: {
        filter,
        status,
        start_date,
        end_date
      }
    });
    
  } catch (error: any) {
    console.error('Error POST sup_anticipos:', error.message);
    return NextResponse.json(
      { error: 'Error generating report' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an advance (only if pending)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Advance ID required' },
        { status: 400 }
      );
    }
    
    // Verify advance exists and is pending
    const advanceCheck = await query(
      'SELECT * FROM advances WHERE id = $1',
      [id]
    );
    
    if (advanceCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Advance not found' },
        { status: 404 }
      );
    }
    
    const advance = advanceCheck.rows[0] as Advance;
    
    if (advance.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Only pending advances can be deleted' },
        { status: 400 }
      );
    }
    
    // Delete the advance
    await query(
      'DELETE FROM advances WHERE id = $1',
      [id]
    );
    
    return NextResponse.json({
      message: 'Advance deleted successfully',
      id: id
    });
    
  } catch (error: any) {
    console.error('Error DELETE sup_anticipos:', error.message);
    return NextResponse.json(
      { error: 'Error deleting advance' },
      { status: 500 }
    );
  }
}