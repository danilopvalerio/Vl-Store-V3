import { GetServerSideProps } from 'next';
import ReportDisplay from '../reports/reportDisplay';

const ProductsReport: React.FC = () => {
  return <ReportDisplay reportType="produtos-mais-vendidos" />;
};

export default ProductsReport;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};