import { GetServerSideProps } from 'next';
import ReportDisplay from './reportDisplay';

const EmployeeSalesReport: React.FC = () => {
  return <ReportDisplay reportType="ranking-funcionarios" />;
};

export default EmployeeSalesReport;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};