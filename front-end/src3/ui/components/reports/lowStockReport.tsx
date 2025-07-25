import { GetServerSideProps } from 'next';
import ReportDisplay from '../reports/reportDisplay';

const LowStockReport: React.FC = () => {
  return <ReportDisplay reportType="estoque-baixo" />;
};

export default LowStockReport;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};