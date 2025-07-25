import { GetServerSideProps } from 'next';
import ReportDisplay from '../reports/reportDisplay';

const FinancialReport: React.FC = () => {
  return <ReportDisplay reportType="financeiro" />;
};

export default FinancialReport;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};