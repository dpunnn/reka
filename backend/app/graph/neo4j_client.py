"""
Graph client untuk Credit Scoring Hybrid (skor "tanggung renteng digital").

Konsep: setiap anggota koperasi adalah node. Saat anggota baru daftar, dia
wajib direferensikan/divouch oleh 1-2 anggota aktif (lihat
app.api.v1.anggota) — ini membuat edge VOUCHES_FOR di graph SEJAK HARI
PERTAMA daftar, jadi anggota baru langsung punya skor jaringan awal tanpa
perlu histori transaksi ATAU integrasi ke sistem eksternal mana pun
(cold-start murni dari data internal REKA).
"""

from neo4j import GraphDatabase

from app.core.config import settings

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
    return _driver


def close_driver():
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


def upsert_anggota_node(anggota_id: str, nama: str, koperasi_id: str) -> None:
    query = """
    MERGE (a:Anggota {id: $anggota_id})
    SET a.nama = $nama, a.koperasi_id = $koperasi_id
    """
    with get_driver().session() as session:
        session.run(query, anggota_id=anggota_id, nama=nama, koperasi_id=koperasi_id)


def add_vouching_relation(voucher_id: str, vouchee_id: str) -> None:
    """voucher_id = anggota lama yang menjamin, vouchee_id = anggota baru yang direferensikan."""
    query = """
    MATCH (voucher:Anggota {id: $voucher_id}), (vouchee:Anggota {id: $vouchee_id})
    MERGE (voucher)-[:VOUCHES_FOR]->(vouchee)
    """
    with get_driver().session() as session:
        session.run(query, voucher_id=voucher_id, vouchee_id=vouchee_id)


def get_graph_score(anggota_id: str) -> dict:
    """
    Skor graph sederhana untuk MVP: berbasis jumlah & kredibilitas voucher.
    TODO upgrade ke PageRank/centrality penuh pakai Neo4j Graph Data Science
    library (plugin sudah disiapkan di docker-compose.yml) kalau waktu cukup
    saat sprint hacking.
    """
    query = """
    MATCH (voucher:Anggota)-[:VOUCHES_FOR]->(a:Anggota {id: $anggota_id})
    OPTIONAL MATCH (grand_voucher:Anggota)-[:VOUCHES_FOR]->(voucher)
    RETURN
        count(DISTINCT voucher) AS jumlah_vouch,
        collect(DISTINCT voucher.nama) AS nama_voucher,
        count(DISTINCT grand_voucher) AS jumlah_grand_voucher
    """
    with get_driver().session() as session:
        record = session.run(query, anggota_id=anggota_id).single()

    jumlah_vouch = record["jumlah_vouch"] if record else 0
    jumlah_grand_voucher = record["jumlah_grand_voucher"] if record else 0
    nama_voucher = record["nama_voucher"] if record else []

    # Formula placeholder MVP: tiap voucher langsung +25 poin (maks 75),
    # tiap grand-voucher (voucher-nya-voucher, second-degree trust) +5 poin (maks 25)
    skor_graph = min(75, jumlah_vouch * 25) + min(25, jumlah_grand_voucher * 5)

    return {
        "skor_graph": skor_graph,
        "jumlah_vouch": jumlah_vouch,
        "nama_voucher": nama_voucher,
        "jumlah_grand_voucher": jumlah_grand_voucher,
    }


def get_network_for_visualization(anggota_id: str) -> dict:
    """Data untuk visualisasi graph interaktif di dashboard Pengurus."""
    query = """
    MATCH (a:Anggota {id: $anggota_id})
    OPTIONAL MATCH (voucher:Anggota)-[:VOUCHES_FOR]->(a)
    OPTIONAL MATCH (a)-[:VOUCHES_FOR]->(vouchee:Anggota)
    RETURN a,
        collect(DISTINCT {id: voucher.id, nama: voucher.nama}) AS vouchers,
        collect(DISTINCT {id: vouchee.id, nama: vouchee.nama}) AS vouchees
    """
    with get_driver().session() as session:
        record = session.run(query, anggota_id=anggota_id).single()

    if not record or record["a"] is None:
        return {"anggota": None, "vouchers": [], "vouchees": []}

    return {
        "anggota": {"id": record["a"]["id"], "nama": record["a"]["nama"]},
        "vouchers": [v for v in record["vouchers"] if v["id"] is not None],
        "vouchees": [v for v in record["vouchees"] if v["id"] is not None],
    }
