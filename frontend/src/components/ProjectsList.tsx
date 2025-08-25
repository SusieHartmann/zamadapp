import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useWalletContext } from '../providers/WalletProvider';

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
`;

const ListCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 15px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  text-align: center;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  justify-content: center;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: 2px solid ${props => props.active ? 'rgba(255, 255, 255, 0.5)' : 'transparent'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 300px;
  padding: 10px 15px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const ProjectCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const ProjectImage = styled.div<{ imageUrl: string }>`
  height: 150px;
  background: ${props => props.imageUrl ? `url(${props.imageUrl})` : 'linear-gradient(135deg, #667eea, #764ba2)'};
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  margin-bottom: 15px;
  position: relative;
  overflow: hidden;
`;

const CategoryBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.7rem;
  border-radius: 12px;
  backdrop-filter: blur(5px);
`;

const ProjectTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  color: #ffffff;
  line-height: 1.3;
`;

const ProjectDescription = styled.p`
  margin: 0 0 15px 0;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProjectMeta = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
`;

const MetaItem = styled.div`
  text-align: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
`;

const MetaLabel = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2px;
  text-transform: uppercase;
`;

const MetaValue = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 15px;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${props => Math.min(props.percentage, 100)}%;
  background: linear-gradient(45deg, #4CAF50, #8BC34A);
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const ProjectStatus = styled.div<{ status: string }>`
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'rgba(76, 175, 80, 0.2)';
      case 'completed': return 'rgba(33, 150, 243, 0.2)';
      case 'expired': return 'rgba(255, 152, 0, 0.2)';
      default: return 'rgba(158, 158, 158, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'expired': return '#FF9800';
      default: return '#9E9E9E';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active': return 'rgba(76, 175, 80, 0.3)';
      case 'completed': return 'rgba(33, 150, 243, 0.3)';
      case 'expired': return 'rgba(255, 152, 0, 0.3)';
      default: return 'rgba(158, 158, 158, 0.3)';
    }
  }};
`;

const ProjectFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

interface Project {
  id: string;
  title: string;
  description: string;
  targetAmount: string;
  currency: string;
  deadline: string;
  category: string;
  imageUrl: string;
  creator: string;
  currentAmount: string;
  backers: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
}

type TabType = 'fhe' | 'create' | 'fund' | 'projects' | 'claim';

interface ProjectsListProps {
  onNavigate?: (tab: TabType) => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ onNavigate }) => {
  const { account } = useWalletContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: 'all', label: '📋 All', icon: '📋' },
    { value: 'active', label: '🟢 Active', icon: '🟢' },
    { value: 'completed', label: '✅ Completed', icon: '✅' },
    { value: 'expired', label: '⏰ Expired', icon: '⏰' }
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, activeFilter, searchTerm]);

  const loadProjects = () => {
    try {
      const existingProjects = JSON.parse(localStorage.getItem('fundingProjects') || '[]') as Project[];
      
      // Update project statuses based on current time
      const updatedProjects = existingProjects.map(project => {
        const now = new Date();
        const deadline = new Date(project.deadline);
        const currentAmount = parseFloat(project.currentAmount);
        const targetAmount = parseFloat(project.targetAmount);
        
        let status: 'active' | 'completed' | 'expired' = project.status;
        
        if (currentAmount >= targetAmount) {
          status = 'completed';
        } else if (now > deadline) {
          status = 'expired';
        } else {
          status = 'active';
        }
        
        return { ...project, status };
      });
      
      // Save updated statuses
      localStorage.setItem('fundingProjects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(project => project.status === activeFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(search) ||
        project.description.toLowerCase().includes(search) ||
        project.category.toLowerCase().includes(search) ||
        project.creator.toLowerCase().includes(search)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredProjects(filtered);
  };

  const getProgressPercentage = (current: string, target: string): number => {
    return (parseFloat(current) / parseFloat(target)) * 100;
  };

  const formatTimeRemaining = (deadline: string): string => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectStats = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalFunded = projects.reduce((sum, p) => sum + parseFloat(p.currentAmount), 0);
    const totalBackers = projects.reduce((sum, p) => sum + p.backers, 0);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalFunded: totalFunded.toFixed(3),
      totalBackers
    };
  };

  const stats = getProjectStats();

  return (
    <ListContainer>
      <ListCard>
        <Title>📊 All Funding Projects</Title>
        
        <StatsSection>
          <StatItem>
            <StatValue>{stats.totalProjects}</StatValue>
            <StatLabel>Total Projects</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.activeProjects}</StatValue>
            <StatLabel>Active</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.completedProjects}</StatValue>
            <StatLabel>Completed</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.totalFunded}</StatValue>
            <StatLabel>ETH Raised</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{stats.totalBackers}</StatValue>
            <StatLabel>Total Backers</StatLabel>
          </StatItem>
        </StatsSection>

        <FilterSection>
          <SearchInput
            type="text"
            placeholder="🔍 Search projects, categories, creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {categories.map((category) => (
            <FilterButton
              key={category.value}
              active={activeFilter === category.value}
              onClick={() => setActiveFilter(category.value as any)}
            >
              {category.label}
            </FilterButton>
          ))}
        </FilterSection>

        {filteredProjects.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: 'rgba(255,255,255,0.7)' 
          }}>
            {projects.length === 0 ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚀</div>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No projects created yet</div>
                <div style={{ fontSize: '0.9rem' }}>Be the first to create an innovative funding project!</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No projects match your search</div>
                <div style={{ fontSize: '0.9rem' }}>Try different keywords or filters</div>
              </>
            )}
          </div>
        ) : (
          <ProjectsGrid>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id}>
                <ProjectImage imageUrl={project.imageUrl}>
                  <CategoryBadge>
                    {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                  </CategoryBadge>
                </ProjectImage>
                
                <ProjectTitle>{project.title}</ProjectTitle>
                <ProjectDescription>{project.description}</ProjectDescription>
                
                <ProgressBar>
                  <ProgressFill percentage={getProgressPercentage(project.currentAmount, project.targetAmount)} />
                </ProgressBar>
                
                <ProjectMeta>
                  <MetaItem>
                    <MetaLabel>Raised</MetaLabel>
                    <MetaValue>{parseFloat(project.currentAmount).toFixed(3)} {project.currency}</MetaValue>
                  </MetaItem>
                  <MetaItem>
                    <MetaLabel>Goal</MetaLabel>
                    <MetaValue>{parseFloat(project.targetAmount).toFixed(3)} {project.currency}</MetaValue>
                  </MetaItem>
                  <MetaItem>
                    <MetaLabel>Progress</MetaLabel>
                    <MetaValue>{getProgressPercentage(project.currentAmount, project.targetAmount).toFixed(1)}%</MetaValue>
                  </MetaItem>
                  <MetaItem>
                    <MetaLabel>Backers</MetaLabel>
                    <MetaValue>{project.backers}</MetaValue>
                  </MetaItem>
                </ProjectMeta>
                
                <ProjectStatus status={project.status}>
                  {project.status === 'active' && `🟢 ${formatTimeRemaining(project.deadline)} left`}
                  {project.status === 'completed' && '✅ Successfully Funded'}
                  {project.status === 'expired' && '⏰ Funding Period Ended'}
                </ProjectStatus>
                
                <ProjectFooter>
                  <div>
                    Created: {formatDate(project.createdAt)}
                  </div>
                  <div>
                    by {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                  </div>
                </ProjectFooter>
              </ProjectCard>
            ))}
          </ProjectsGrid>
        )}
      </ListCard>
    </ListContainer>
  );
};

export default ProjectsList;