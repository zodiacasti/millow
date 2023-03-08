const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender, realEstate, escrow;
  beforeEach(async () => {
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    //Deploy contract
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    //Mint
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );
    await transaction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.address,
      seller.address,
      inspector.address,
      lender.address
    );

    // Approve from seller

    transaction = await realEstate.connect(seller).approve(escrow.address, 1);
    await transaction.wait();

    // Listing th eproperty

    transaction = await escrow
      .connect(seller)
      .list(1, tokens(10), buyer.address, tokens(5));
    await transaction.wait();
  });

  describe("Desployment", () => {
    it("returns nft address", async () => {
      const result = await escrow.nftAddress();
      expect(result).to.equal(realEstate.address);
    });
    it("returns seller", async () => {
      const result = await escrow.seller();
      expect(result).to.equal(seller.address);
    });
    it("returns inspector", async () => {
      const result = await escrow.inspector();
      expect(result).to.equal(inspector.address);
    });
    it("returns lender", async () => {
      const result = await escrow.lender();
      expect(result).to.equal(lender.address);
    });
  });

  describe("Listing", () => {
    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.equal(escrow.address);
    });

    it("Updates as listed", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.equal(true);
    });
    it("Returns buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.equal(buyer.address);
    });
    it("Returns puchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.equal(tokens(10));
    });
    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.equal(tokens(5));
    });
  });

  describe("Deposits", () => {
    it("Updates contract balance", async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();
      const result = await escrow.getBalance();
      expect(result).to.equal(tokens(5));
    });
  });

  describe("Inspection", () => {
    it("Updates inspection status", async () => {
      const transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();
      const result = await escrow.inspectionPassed(1);
      expect(result).to.equal(true);
    });
  });

  describe("Approval", () => {
    it("Updates approval status", async () => {
      let transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();
      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();
      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      expect(await escrow.approval(1, buyer.address)).to.equal(true);
      expect(await escrow.approval(1, seller.address)).to.equal(true);
      expect(await escrow.approval(1, lender.address)).to.equal(true);
    });
  });

  describe("Sale", () => {
    beforeEach(async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();

      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();

      transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      await lender.sendTransaction({ to: escrow.address, value: tokens(5) });

      transaction = await escrow.connect(seller).finalizeSale(1);
      await transaction.wait();
    });

    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
    });

    it("Updates balance", async () => {
      expect(await escrow.getBalance()).to.be.equal(0);
    });
  });
});
