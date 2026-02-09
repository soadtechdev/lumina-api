import { connect, model, Schema } from 'mongoose';

const BillSchema = new Schema({}, { strict: false });
const Bill = model('Bill', BillSchema, 'bill');

async function migrate() {
  // Conectar
  await connect('mongodb+srv://gerardo:fARPxD11TG9usxT0@cluster0.b0yyp.mongodb.net/', {
    dbName: 'splittier-v2',
  });

  console.log('🔄 Iniciando migración...');

  // Buscar facturas settled con splits pendientes
  const bills = await Bill.find({
    status: 'settled',
    deletedAt: null,
    $or: [
      { 'splits.status': 'pending' },
      { 'splits.status': { $exists: false } },
      { 'splits.status': null },
    ],
  });

  console.log(`📋 Encontradas ${bills.length} facturas para corregir`);

  let fixed = 0;

  for (const bill of bills) {
    const updates: Record<string, string> = {};

    (bill as any).splits.forEach((split: any, i: number) => {
      if (!split.status || split.status === 'pending' || split.status === 'partially_paid') {
        updates[`splits.${i}.status`] = 'settled';
        fixed++;
      }
    });

    if (Object.keys(updates).length > 0) {
      await Bill.updateOne({ _id: bill._id }, { $set: updates });
      console.log(`✅ ${(bill as any).name}: ${Object.keys(updates).length} splits`);
    }
  }

  console.log(`\n🎉 Migración completada: ${fixed} splits corregidos`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
// 6807ac188b7c7882587a3df8, 66d604928b7c7882587a06b1
