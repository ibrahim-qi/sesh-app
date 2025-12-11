export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          name: string
          avatar_url: string | null
          role: 'admin' | 'host' | 'captain' | 'player'
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          avatar_url?: string | null
          role?: 'admin' | 'host' | 'captain' | 'player'
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          avatar_url?: string | null
          role?: 'admin' | 'host' | 'captain' | 'player'
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          group_id: string
          host_id: string | null
          created_by: string | null
          date: string
          location: string | null
          status: 'upcoming' | 'live' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          host_id?: string | null
          created_by?: string | null
          date: string
          location?: string | null
          status?: 'upcoming' | 'live' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          host_id?: string | null
          created_by?: string | null
          date?: string
          location?: string | null
          status?: 'upcoming' | 'live' | 'completed'
          created_at?: string
        }
      }
      session_teams: {
        Row: {
          id: string
          session_id: string
          name: string
          color: string
          captain_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          color: string
          captain_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          color?: string
          captain_id?: string | null
          created_at?: string
        }
      }
      session_team_players: {
        Row: {
          id: string
          session_team_id: string
          group_member_id: string
        }
        Insert: {
          id?: string
          session_team_id: string
          group_member_id: string
        }
        Update: {
          id?: string
          session_team_id?: string
          group_member_id?: string
        }
      }
      games: {
        Row: {
          id: string
          session_id: string
          team1_id: string
          team2_id: string
          team1_score: number
          team2_score: number
          winner_team_id: string | null
          status: 'in_progress' | 'completed'
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          team1_id: string
          team2_id: string
          team1_score?: number
          team2_score?: number
          winner_team_id?: string | null
          status?: 'in_progress' | 'completed'
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          team1_id?: string
          team2_id?: string
          team1_score?: number
          team2_score?: number
          winner_team_id?: string | null
          status?: 'in_progress' | 'completed'
          created_at?: string
          completed_at?: string | null
        }
      }
      game_scores: {
        Row: {
          id: string
          game_id: string
          group_member_id: string
          team_id: string
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          group_member_id: string
          team_id: string
          points: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          group_member_id?: string
          team_id?: string
          points?: number
          created_at?: string
        }
      }
    }
  }
}

export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionTeam = Database['public']['Tables']['session_teams']['Row']
export type SessionTeamPlayer = Database['public']['Tables']['session_team_players']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type GameScore = Database['public']['Tables']['game_scores']['Row']
